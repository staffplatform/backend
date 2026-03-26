import { CompanyRole, PrismaClient, ScheduleEntryType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const seedUser = {
  email: 'employee@example.com',
  password: 'StrongPass123',
  firstName: 'Ivan',
  lastName: 'Petrov',
  birthDate: new Date('1992-07-14'),
  avatarUrl: 'https://cdn.example.com/avatars/ivan-petrov.jpg',
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
    avatarUrl: 'https://cdn.example.com/avatars/anna-smirnova.jpg',
    jobTitle: 'Store Manager',
    workCity: 'Moscow',
    workAddress: 'ул. Тверская, 7',
    companyAddress: 'ул. Тверская, 7, офис 12',
    companyRole: CompanyRole.MANAGER,
    storeNames: ['Acme Tverskaya', 'Acme Arbat']
  },
  {
    email: 'maria.barista@example.com',
    password: 'StrongPass123',
    firstName: 'Maria',
    lastName: 'Ivanova',
    birthDate: new Date('1998-09-05'),
    avatarUrl: 'https://cdn.example.com/avatars/maria-ivanova.jpg',
    jobTitle: 'Barista',
    workCity: 'Moscow',
    workAddress: 'ул. Тверская, 7',
    companyAddress: 'ул. Тверская, 7, офис 12',
    companyRole: CompanyRole.EMPLOYEE,
    storeNames: ['Acme Tverskaya', 'Acme Arbat']
  },
  {
    email: 'oleg.cashier@example.com',
    password: 'StrongPass123',
    firstName: 'Oleg',
    lastName: 'Sidorov',
    birthDate: new Date('1995-11-12'),
    avatarUrl: 'https://cdn.example.com/avatars/oleg-sidorov.jpg',
    jobTitle: 'Cashier',
    workCity: 'Moscow',
    workAddress: 'ул. Арбат, 12',
    companyAddress: 'ул. Тверская, 7, офис 12',
    companyRole: CompanyRole.EMPLOYEE,
    storeNames: ['Acme Tverskaya']
  },
  {
    email: 'svetlana.barista@example.com',
    password: 'StrongPass123',
    firstName: 'Svetlana',
    lastName: 'Morozova',
    birthDate: new Date('1997-04-23'),
    avatarUrl: 'https://cdn.example.com/avatars/svetlana-morozova.jpg',
    jobTitle: 'Senior Barista',
    workCity: 'Moscow',
    workAddress: 'ул. Арбат, 12',
    companyAddress: 'ул. Тверская, 7, офис 12',
    companyRole: CompanyRole.EMPLOYEE,
    storeNames: ['Acme Sokolniki']
  },
  {
    email: 'pavel.manager@example.com',
    password: 'StrongPass123',
    firstName: 'Pavel',
    lastName: 'Kozlov',
    birthDate: new Date('1989-01-30'),
    avatarUrl: 'https://cdn.example.com/avatars/pavel-kozlov.jpg',
    jobTitle: 'Store Manager',
    workCity: 'Moscow',
    workAddress: 'Сокольническая площадь, 4',
    companyAddress: 'ул. Тверская, 7, офис 12',
    companyRole: CompanyRole.MANAGER,
    storeNames: ['Acme Sokolniki']
  },
  {
    email: 'irina.barista@example.com',
    password: 'StrongPass123',
    firstName: 'Irina',
    lastName: 'Volkova',
    birthDate: new Date('2000-06-14'),
    avatarUrl: 'https://cdn.example.com/avatars/irina-volkova.jpg',
    jobTitle: 'Barista',
    workCity: 'Moscow',
    workAddress: 'Сокольническая площадь, 4',
    companyAddress: 'ул. Тверская, 7, офис 12',
    companyRole: CompanyRole.EMPLOYEE,
    storeNames: ['Acme Sokolniki']
  }
] as const;

const seedCompany = {
  name: 'Acme Staff Platform'
};

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

  const existingCompany = await prisma.company.findFirst({
    where: {
      ownerId: user.id,
      name: seedCompany.name
    },
    select: {
      id: true
    }
  });

  const company = existingCompany
    ? await prisma.company.update({
        where: { id: existingCompany.id },
        data: { name: seedCompany.name }
      })
    : await prisma.company.create({
        data: {
          name: seedCompany.name,
          ownerId: user.id
        }
      });

  await prisma.companyMember.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: user.id
      }
    },
    update: {
      role: CompanyRole.OWNER
    },
    create: {
      companyId: company.id,
      userId: user.id,
      role: CompanyRole.OWNER
    }
  });

  const scheduleDates = seededScheduleMonths.flatMap(({ year, month }) =>
    getMonthDates(year, month)
  );
  const stores = await Promise.all(
    seedStores.map(async (seedStore, index) => {
      const existingStore = await prisma.store.findFirst({
        where: {
          companyId: company.id,
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
              companyId: company.id,
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
        update: {},
        create: {
          storeId: store.id,
          userId: user.id
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
      companyRole: CompanyRole.OWNER,
      storeNames: seedStores.map((store) => store.name)
    },
    ...seedEmployees
  ];

  for (const [userIndex, employee] of allUsers.entries()) {
    const employeePasswordHash =
      employee.email === seedUser.email ? passwordHash : await bcrypt.hash(employee.password, 10);

    const companyUser = await prisma.user.upsert({
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

    await prisma.companyMember.upsert({
      where: {
        companyId_userId: {
          companyId: company.id,
          userId: companyUser.id
        }
      },
      update: {
        role: employee.companyRole
      },
      create: {
        companyId: company.id,
        userId: companyUser.id,
        role: employee.companyRole
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
            userId: companyUser.id
          }
        },
        update: {},
        create: {
          storeId: store.id,
          userId: companyUser.id
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
            userId: companyUser.id,
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
  console.log(`Company: ${company.name}`);
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
