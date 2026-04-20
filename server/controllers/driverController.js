const { validationResult } = require("express-validator");
const { prisma } = require("../utils/prisma");
const { getIO } = require("../sockets");
const { haversineKm } = require("../utils/distance");

async function assignPendingRequestToIdleAmbulance(ambulanceId) {
  const ambulance = await prisma.ambulance.findUnique({
    where: { id: ambulanceId },
  });
  if (!ambulance || !ambulance.available) return;

  const pendingUnassigned = await prisma.request.findMany({
    where: { status: "pending", ambulanceId: null },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!pendingUnassigned.length) return;

  let chosen = null;
  let minDistance = Infinity;
  for (const request of pendingUnassigned) {
    const distance = haversineKm(request.lat, request.lng, ambulance.lat, ambulance.lng);
    if (distance < minDistance) {
      minDistance = distance;
      chosen = request;
    }
  }
  if (!chosen) return;

  const updatedRequest = await prisma.request.update({
    where: { id: chosen.id },
    data: { ambulanceId: ambulance.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      ambulance: { include: { driver: { select: { id: true, name: true, email: true } } } },
    },
  });

  await prisma.ambulance.update({
    where: { id: ambulance.id },
    data: { available: false, status: "assigned" },
  });

  const io = getIO();
  io.to(`user:${ambulance.driverId}`).emit("new_request", {
    request: updatedRequest,
    distanceKm: minDistance,
  });
}

async function listRequests(req, res) {
  const driverId = req.user.id;

  const ambulance = await prisma.ambulance.findUnique({ where: { driverId } });
  if (!ambulance) return res.status(404).json({ message: "Ambulance not found" });

  const requests = await prisma.request.findMany({
    where: {
      ambulanceId: ambulance.id,
      status: { in: ["pending", "accepted"] },
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return res.json({ ambulance, requests });
}

async function acceptRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const driverId = req.user.id;
  const { requestId, action } = req.body; // action: "accept" | "reject"

  const ambulance = await prisma.ambulance.findUnique({ where: { driverId } });
  if (!ambulance) return res.status(404).json({ message: "Ambulance not found" });

  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) return res.status(404).json({ message: "Request not found" });
  if (request.ambulanceId !== ambulance.id) {
    return res.status(403).json({ message: "Not assigned to your ambulance" });
  }
  if (request.status !== "pending") {
    return res.status(400).json({ message: "Request is not pending" });
  }

  const io = getIO();

  if (action === "reject") {
    const updated = await prisma.request.update({
      where: { id: requestId },
      data: { status: "rejected" },
    });
    await prisma.ambulance.update({
      where: { id: ambulance.id },
      data: { available: true, status: "idle" },
    });
    await assignPendingRequestToIdleAmbulance(ambulance.id);
    io.to(`user:${request.userId}`).emit("request_completed", { requestId, status: "rejected" });
    return res.json({ request: updated });
  }

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: "accepted" },
    include: { ambulance: true },
  });

  await prisma.ambulance.update({
    where: { id: ambulance.id },
    data: { status: "enroute", available: false },
  });

  io.to(`user:${request.userId}`).emit("request_accepted", { request: updated });
  return res.json({ request: updated });
}

async function locationUpdate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const driverId = req.user.id;
  const { lat, lng } = req.body;

  const ambulance = await prisma.ambulance.findUnique({ where: { driverId } });
  if (!ambulance) return res.status(404).json({ message: "Ambulance not found" });

  const activeRequest = await prisma.request.findFirst({
    where: { ambulanceId: ambulance.id, status: "accepted" },
    orderBy: { createdAt: "desc" },
  });

  await prisma.ambulance.update({
    where: { id: ambulance.id },
    data: { lat, lng },
  });

  const loc = await prisma.locationUpdate.create({
    data: { ambulanceId: ambulance.id, lat, lng },
  });

  const io = getIO();
  if (activeRequest) {
    io.to(`user:${activeRequest.userId}`).emit("location_update", {
      requestId: activeRequest.id,
      ambulanceId: ambulance.id,
      lat,
      lng,
      timestamp: loc.timestamp,
    });
  }

  return res.json({ ok: true });
}

async function completeRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const driverId = req.user.id;
  const { requestId } = req.body;

  const ambulance = await prisma.ambulance.findUnique({ where: { driverId } });
  if (!ambulance) return res.status(404).json({ message: "Ambulance not found" });

  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) return res.status(404).json({ message: "Request not found" });
  if (request.ambulanceId !== ambulance.id) {
    return res.status(403).json({ message: "Not assigned to your ambulance" });
  }
  if (request.status !== "accepted") {
    return res.status(400).json({ message: "Request must be accepted first" });
  }

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: "completed" },
  });

  await prisma.ambulance.update({
    where: { id: ambulance.id },
    data: { available: true, status: "idle" },
  });
  await assignPendingRequestToIdleAmbulance(ambulance.id);

  const io = getIO();
  io.to(`user:${request.userId}`).emit("request_completed", { request: updated });

  return res.json({ request: updated });
}

module.exports = { listRequests, acceptRequest, locationUpdate, completeRequest };

