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
    address: 'ул. Тверская, 7'
  },
  {
    name: 'Acme Arbat',
    city: 'Moscow',
    address: 'ул. Арбат, 12'
  },
  {
    name: 'Acme Sokolniki',
    city: 'Moscow',
    address: 'Сокольническая площадь, 4'
  }
];

function getCurrentMonthShiftDates(): string[] {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  return [2, 4, 6, 9, 11].map((day) =>
    new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)
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

  const scheduleDates = getCurrentMonthShiftDates();
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
              address: seedStore.address
            }
          })
        : await prisma.store.create({
            data: {
              companyId: company.id,
              name: seedStore.name,
              city: seedStore.city,
              address: seedStore.address
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

      await Promise.all(
        scheduleDates.map((date) =>
          prisma.scheduleEntry.upsert({
            where: {
              storeId_userId_date: {
                storeId: store.id,
                userId: user.id,
                date: new Date(`${date}T00:00:00.000Z`)
              }
            },
            update: {
              type: ScheduleEntryType.SHIFT,
              startTime: index === 0 ? '09:00' : index === 1 ? '10:00' : '11:00',
              endTime: index === 0 ? '18:00' : index === 1 ? '19:00' : '20:00',
              comment: `${seedStore.name} test shift`,
              createdById: user.id
            },
            create: {
              storeId: store.id,
              userId: user.id,
              date: new Date(`${date}T00:00:00.000Z`),
              type: ScheduleEntryType.SHIFT,
              startTime: index === 0 ? '09:00' : index === 1 ? '10:00' : '11:00',
              endTime: index === 0 ? '18:00' : index === 1 ? '19:00' : '20:00',
              comment: `${seedStore.name} test shift`,
              createdById: user.id
            }
          })
        )
      );

      return store;
    })
  );

  const storeByName = new Map(stores.map((store) => [store.name, store]));

  const allUsers = [{ ...seedUser, companyRole: CompanyRole.OWNER, storeNames: seedStores.map((store) => store.name) }, ...seedEmployees];

  for (const [userIndex, employee] of allUsers.entries()) {
    const employeePasswordHash =
      employee.email === seedUser.email
        ? passwordHash
        : await bcrypt.hash(employee.password, 10);

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

      const shiftWindow = getShiftWindow(userIndex);

      await Promise.all(
        scheduleDates.map((date) =>
          prisma.scheduleEntry.upsert({
            where: {
              storeId_userId_date: {
                storeId: store.id,
                userId: companyUser.id,
                date: new Date(`${date}T00:00:00.000Z`)
              }
            },
            update: {
              type: ScheduleEntryType.SHIFT,
              startTime: shiftWindow.startTime,
              endTime: shiftWindow.endTime,
              comment: `${store.name} ${employee.jobTitle} shift`,
              createdById: user.id
            },
            create: {
              storeId: store.id,
              userId: companyUser.id,
              date: new Date(`${date}T00:00:00.000Z`),
              type: ScheduleEntryType.SHIFT,
              startTime: shiftWindow.startTime,
              endTime: shiftWindow.endTime,
              comment: `${store.name} ${employee.jobTitle} shift`,
              createdById: user.id
            }
          })
        )
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
  console.log(`Schedule dates: ${scheduleDates.join(', ')}`);
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
