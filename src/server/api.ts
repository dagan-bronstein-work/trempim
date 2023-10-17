import { remultExpress } from 'remult/remult-express'
import { User } from '../app/users/user'
import { SignInController } from '../app/users/SignInController'
import { initRequest } from './server-session'
import { Task, TaskStatusChanges } from '../app/events/tasks'
import { createPostgresDataProviderWithSchema } from './PostgresSchemaWrapper'
import { config } from 'dotenv'
import { SqlDatabase, repo } from 'remult'
import { VersionInfo } from './version'
//import { readExcelVolunteers } from './read-excel'
//import { readTripExcel } from './read-excel'

config() //loads the configuration from the .env file

//SqlDatabase.LogToConsole = 'oneLiner'
const entities = [User, Task, TaskStatusChanges, VersionInfo]
export const api = remultExpress({
  controllers: [SignInController],
  entities,
  initRequest,
  dataProvider: () =>
    createPostgresDataProviderWithSchema({
      disableSsl: Boolean(process.env['dev']),
      schema: process.env['DB_SCHEMA']!,
    }),
  initApi: async () => {},
})
