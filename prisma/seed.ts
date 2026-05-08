import { PrismaClient, ScheduleEntryType, StoreRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const seedUser = {
  email: 'employee@example.com',
  password: 'StrongPass123',
  firstName: 'Ivan',
  lastName: 'Petrov',
  birthDate: new Date('1992-07-14'),
  avatarUrl: null,
  jobTitle: 'Barista',
  workCity: 'Moscow',
  workAddress: 'ул. Ленина, 10',
  companyAddress: 'ул. Тверская, 7, офис 12'
};

const seedEmployees = [
  {
    email: 'anna.manager@example.com',
    password: 'StrongPass123',
    firstName: 'Anna',
    lastName: 'Smirnova',
    birthDate: new Date('1990-03-18'),
    avatarUrl: null,
    jobTitle: 'Store Manager',
    workCity: 'Moscow',
    workAddress: 'ул. Тверская, 7',
    companyAddress: 'ул. Тверская, 7, офис 12',
    storeRole: StoreRole.MANAGER,
    storeNames: ['Acme Tverskaya', 'Acme Arbat']
  },
  {
    email: 'maria.barista@example.com',
    password: 'StrongPass123',
    firstName: 'Maria',
    lastName: 'Ivanova',
    birthDate: new Date('1998-09-05'),
    avatarUrl: null,
    jobTitle: 'Barista',
    workCity: 'Moscow',
    workAddress: 'ул. Тверская, 7',
    companyAddress: 'ул. Тверская, 7, офис 12',
    storeRole: StoreRole.EMPLOYEE,
    storeNames: ['Acme Tverskaya', 'Acme Arbat']
  },
  {
    email: 'oleg.cashier@example.com',
    password: 'StrongPass123',
    firstName: 'Oleg',
    lastName: 'Sidorov',
    birthDate: new Date('1995-11-12'),
    avatarUrl: null,
    jobTitle: 'Cashier',
    workCity: 'Moscow',
    workAddress: 'ул. Арбат, 12',
    companyAddress: 'ул. Тверская, 7, офис 12',
    storeRole: StoreRole.EMPLOYEE,
    storeNames: ['Acme Tverskaya']
  },
  {
    email: 'svetlana.barista@example.com',
    password: 'StrongPass123',
    firstName: 'Svetlana',
    lastName: 'Morozova',
    birthDate: new Date('1997-04-23'),
    avatarUrl: null,
    jobTitle: 'Senior Barista',
    workCity: 'Moscow',
    workAddress: 'ул. Арбат, 12',
    companyAddress: 'ул. Тверская, 7, офис 12',
    storeRole: StoreRole.EMPLOYEE,
    storeNames: ['Acme Sokolniki']
  },
  {
    email: 'pavel.manager@example.com',
    password: 'StrongPass123',
    firstName: 'Pavel',
    lastName: 'Kozlov',
    birthDate: new Date('1989-01-30'),
    avatarUrl: null,
    jobTitle: 'Store Manager',
    workCity: 'Moscow',
    workAddress: 'Сокольническая площадь, 4',
    companyAddress: 'ул. Тверская, 7, офис 12',
    storeRole: StoreRole.MANAGER,
    storeNames: ['Acme Sokolniki']
  },
  {
    email: 'irina.barista@example.com',
    password: 'StrongPass123',
    firstName: 'Irina',
    lastName: 'Volkova',
    birthDate: new Date('2000-06-14'),
    avatarUrl: null,
    jobTitle: 'Barista',
    workCity: 'Moscow',
    workAddress: 'Сокольническая площадь, 4',
    companyAddress: 'ул. Тверская, 7, офис 12',
    storeRole: StoreRole.EMPLOYEE,
    storeNames: ['Acme Sokolniki']
  }
] as const;

const seedStores = [
  {
    name: 'Acme Tverskaya',
    city: 'Moscow',
    address: 'ул. Тверская, 7',
    activeFrom: new Date('2026-03-01')
  },
  {
    name: 'Acme Arbat',
    city: 'Moscow',
    address: 'ул. Арбат, 12',
    activeFrom: new Date('2026-03-01')
  },
  {
    name: 'Acme Sokolniki',
    city: 'Moscow',
    address: 'Сокольническая площадь, 4',
    activeFrom: new Date('2026-03-01')
  }
];

const seededScheduleMonths = [
  { year: 2026, month: 3 },
  { year: 2026, month: 4 },
  { year: 2026, month: 5 }
] as const;

const overlappingShiftDemoEntries = new Map<
  string,
  {
    type: ScheduleEntryType;
    startTime: string | null;
    endTime: string | null;
    comment: string;
  }
>([
  [
    '2026-03-31:Acme Tverskaya:employee@example.com',
    {
      type: ScheduleEntryType.SHIFT,
      startTime: '09:00',
      endTime: '18:00',
      comment: 'Shared opening shift demo'
    }
  ],
  [
    '2026-03-31:Acme Tverskaya:anna.manager@example.com',
    {
      type: ScheduleEntryType.SHIFT,
      startTime: '09:00',
      endTime: '18:00',
      comment: 'Shared opening shift demo'
    }
  ],
  [
    '2026-03-31:Acme Tverskaya:maria.barista@example.com',
    {
      type: ScheduleEntryType.SHIFT,
      startTime: '09:00',
      endTime: '18:00',
      comment: 'Shared opening shift demo'
    }
  ]
]);

function getMonthDates(year: number, month: number): string[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return Array.from({ length: daysInMonth }, (_, index) =>
    new Date(Date.UTC(year, month - 1, index + 1)).toISOString().slice(0, 10)
  );
}

function getShiftWindow(index: number): { startTime: string; endTime: string } {
  const windows = [
    { startTime: '08:00', endTime: '17:00' },
    { startTime: '09:00', endTime: '18:00' },
    { startTime: '10:00', endTime: '19:00' },
    { startTime: '11:00', endTime: '20:00' }
  ];

  return windows[index % windows.length];
}

function hashString(value: string): number {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function buildRandomizedScheduleEntry(
  date: string,
  storeName: string,
  employeeEmail: string,
  jobTitle: string
): {
  type: ScheduleEntryType;
  startTime: string | null;
  endTime: string | null;
  comment: string;
} | null {
  const forcedEntry = overlappingShiftDemoEntries.get(`${date}:${storeName}:${employeeEmail}`);

  if (forcedEntry) {
    return forcedEntry;
  }

  const dayOfWeek = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const seed = hashString(`${storeName}:${employeeEmail}:${date}`);

  if (dayOfWeek === 0 && seed % 4 !== 0) {
    return null;
  }

  if (dayOfWeek === 6 && seed % 5 === 0) {
    return null;
  }

  if (seed % 19 === 0) {
    return {
      type: ScheduleEntryType.VACATION,
      startTime: null,
      endTime: null,
      comment: 'Planned vacation'
    };
  }

  if (seed % 31 === 0) {
    return {
      type: ScheduleEntryType.ABSENCE,
      startTime: null,
      endTime: null,
      comment: 'Personal day'
    };
  }

  const windows = [
    { startTime: '07:00', endTime: '16:00' },
    { startTime: '08:00', endTime: '17:00' },
    { startTime: '09:00', endTime: '18:00' },
    { startTime: '10:00', endTime: '19:00' },
    { startTime: '11:00', endTime: '20:00' }
  ];
  const shiftWindow = windows[seed % windows.length];

  return {
    type: ScheduleEntryType.SHIFT,
    startTime: shiftWindow.startTime,
    endTime: shiftWindow.endTime,
    comment: `${storeName} ${jobTitle} shift`
  };
}

async function upsertScheduleEntry(params: {
  storeId: string;
  userId: string;
  date: string;
  createdById: string;
  type: ScheduleEntryType;
  startTime: string | null;
  endTime: string | null;
  comment: string;
}): Promise<void> {
  await prisma.scheduleEntry.upsert({
    where: {
      storeId_userId_date: {
        storeId: params.storeId,
        userId: params.userId,
        date: new Date(`${params.date}T00:00:00.000Z`)
      }
    },
    update: {
      type: params.type,
      startTime: params.startTime,
      endTime: params.endTime,
      comment: params.comment,
      createdById: params.createdById
    },
    create: {
      storeId: params.storeId,
      userId: params.userId,
      date: new Date(`${params.date}T00:00:00.000Z`),
      type: params.type,
      startTime: params.startTime,
      endTime: params.endTime,
      comment: params.comment,
      createdById: params.createdById
    }
  });
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(seedUser.password, 10);

  const user = await prisma.user.upsert({
    where: { email: seedUser.email },
    update: {
      passwordHash,
      firstName: seedUser.firstName,
      lastName: seedUser.lastName,
      birthDate: seedUser.birthDate,
      avatarUrl: seedUser.avatarUrl,
      jobTitle: seedUser.jobTitle,
      workCity: seedUser.workCity,
      workAddress: seedUser.workAddress,
      companyAddress: seedUser.companyAddress
    },
    create: {
      email: seedUser.email,
      passwordHash,
      firstName: seedUser.firstName,
      lastName: seedUser.lastName,
      birthDate: seedUser.birthDate,
      avatarUrl: seedUser.avatarUrl,
      jobTitle: seedUser.jobTitle,
      workCity: seedUser.workCity,
      workAddress: seedUser.workAddress,
      companyAddress: seedUser.companyAddress
    }
  });

  const scheduleDates = seededScheduleMonths.flatMap(({ year, month }) =>
    getMonthDates(year, month)
  );
  const stores = await Promise.all(
    seedStores.map(async (seedStore) => {
      const existingStore = await prisma.store.findFirst({
        where: {
          name: seedStore.name
        },
        select: {
          id: true
        }
      });

      const store = existingStore
        ? await prisma.store.update({
            where: { id: existingStore.id },
            data: {
              name: seedStore.name,
              city: seedStore.city,
              address: seedStore.address,
              activeFrom: seedStore.activeFrom
            }
          })
        : await prisma.store.create({
            data: {
              name: seedStore.name,
              city: seedStore.city,
              address: seedStore.address,
              activeFrom: seedStore.activeFrom
            }
          });

      await prisma.storeEmployee.upsert({
        where: {
          storeId_userId: {
            storeId: store.id,
            userId: user.id
          }
        },
        update: {
          role: StoreRole.OWNER
        },
        create: {
          storeId: store.id,
          userId: user.id,
          role: StoreRole.OWNER
        }
      });

      return store;
    })
  );

  const storeByName = new Map(stores.map((store) => [store.name, store]));

  await prisma.scheduleEntry.deleteMany({
    where: {
      storeId: {
        in: stores.map((store) => store.id)
      }
    }
  });

  const allUsers = [
    {
      ...seedUser,
      storeRole: StoreRole.OWNER,
      storeNames: seedStores.map((store) => store.name)
    },
    ...seedEmployees
  ];

  for (const [userIndex, employee] of allUsers.entries()) {
    const employeePasswordHash =
      employee.email === seedUser.email ? passwordHash : await bcrypt.hash(employee.password, 10);

    const storeUser = await prisma.user.upsert({
      where: { email: employee.email },
      update: {
        passwordHash: employeePasswordHash,
        firstName: employee.firstName,
        lastName: employee.lastName,
        birthDate: employee.birthDate,
        avatarUrl: employee.avatarUrl,
        jobTitle: employee.jobTitle,
        workCity: employee.workCity,
        workAddress: employee.workAddress,
        companyAddress: employee.companyAddress
      },
      create: {
        email: employee.email,
        passwordHash: employeePasswordHash,
        firstName: employee.firstName,
        lastName: employee.lastName,
        birthDate: employee.birthDate,
        avatarUrl: employee.avatarUrl,
        jobTitle: employee.jobTitle,
        workCity: employee.workCity,
        workAddress: employee.workAddress,
        companyAddress: employee.companyAddress
      }
    });

    for (const storeName of employee.storeNames) {
      const store = storeByName.get(storeName);

      if (!store) {
        continue;
      }

      await prisma.storeEmployee.upsert({
        where: {
          storeId_userId: {
            storeId: store.id,
            userId: storeUser.id
          }
        },
        update: {
          role: employee.storeRole
        },
        create: {
          storeId: store.id,
          userId: storeUser.id,
          role: employee.storeRole
        }
      });

      await Promise.all(
        scheduleDates.map(async (date) => {
          const scheduleEntry = buildRandomizedScheduleEntry(
            date,
            store.name,
            employee.email,
            employee.jobTitle
          );

          if (!scheduleEntry) {
            return;
          }

          await upsertScheduleEntry({
            storeId: store.id,
            userId: storeUser.id,
            date,
            createdById: user.id,
            type: scheduleEntry.type,
            startTime: scheduleEntry.startTime,
            endTime: scheduleEntry.endTime,
            comment: scheduleEntry.comment
          });
        })
      );
    }
  }

  const storeEmployeeCounts = await Promise.all(
    stores.map(async (store) => {
      const employeesCount = await prisma.storeEmployee.count({
        where: {
          storeId: store.id
        }
      });

      return `${store.name}: ${employeesCount}`;
    })
  );

  console.log('Seed completed');
  console.log(`User: ${seedUser.email} / ${seedUser.password}`);
  console.log(`Stores: ${stores.map((store) => store.name).join(', ')}`);
  console.log(`Store employee counts: ${storeEmployeeCounts.join(', ')}`);
  console.log(
    `Schedule months: ${seededScheduleMonths.map(({ year, month }) => `${year}-${String(month).padStart(2, '0')}`).join(', ')}`
  );
}

main()
  .catch(async (error) => {
    console.error('Seed failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
