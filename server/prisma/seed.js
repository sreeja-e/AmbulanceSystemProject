const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function upsertUser({ name, email, password, role }) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, password: hash, role },
    create: { name, email, password: hash, role },
  });
}

async function main() {
  const admin = await upsertUser({
    name: "Admin",
    email: "admin@uas.local",
    password: "Admin@12345",
    role: "ADMIN",
  });

  const driver1 = await upsertUser({
    name: "Driver One",
    email: "driver1@uas.local",
    password: "Driver@12345",
    role: "DRIVER",
  });

  const driver2 = await upsertUser({
    name: "Driver Two",
    email: "driver2@uas.local",
    password: "Driver@12345",
    role: "DRIVER",
  });

  const user1 = await upsertUser({
    name: "User One",
    email: "user1@uas.local",
    password: "User@12345",
    role: "USER",
  });

  // Two ambulances near a default city-ish area (you can change later in UI)
  await prisma.ambulance.upsert({
    where: { driverId: driver1.id },
    update: { available: true, lat: 30.0444, lng: 31.2357, status: "idle" },
    create: {
      driverId: driver1.id,
      available: true,
      lat: 30.0444,
      lng: 31.2357,
      status: "idle",
    },
  });

  await prisma.ambulance.upsert({
    where: { driverId: driver2.id },
    update: { available: true, lat: 30.05, lng: 31.24, status: "idle" },
    create: {
      driverId: driver2.id,
      available: true,
      lat: 30.05,
      lng: 31.24,
      status: "idle",
    },
  });

  console.log("Seed complete:", {
    admin: admin.email,
    user1: user1.email,
    driver1: driver1.email,
    driver2: driver2.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

