import { Component, OnInit } from '@angular/core'
import { User } from './user'

import { UIToolsService } from '../common/UIToolsService'
import { Roles } from './roles'

import { terms } from '../terms'
import { GridSettings } from 'common-ui-elements/interfaces'
import { remult, repo } from 'remult'
import { saveToExcel } from '../common-ui-elements/interfaces/src/saveGridToExcel'
import { BusyService } from '../common-ui-elements'
import { SignInController } from './SignInController'
import { sendWhatsappToPhone } from '../events/phone'

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  constructor(private ui: UIToolsService, private busyService: BusyService) {}
  isAdmin() {
    return remult.isAllowed(Roles.admin)
  }

  users: GridSettings<User> = new GridSettings<User>(remult.repo(User), {
    allowDelete: false,
    allowInsert: false,
    allowUpdate: true,
    columnOrderStateKey: 'users',

    orderBy: { name: 'asc' },
    rowsInPage: 100,

    columnSettings: (users) => [
      users.name,
      users.phone,
      users.dispatcher,
      users.trainee,
      users.admin,
      users.deleted,
    ],
    rowCssClass: (row) => (row.deleted ? 'canceled' : ''),
    gridButtons: [
      {
        name: 'Excel',
        click: () => saveToExcel(this.users, 'users', this.busyService),
      },
    ],
    rowButtons: [
      {
        name: 'פרטים',
        click: async (e) => e.editDialog(this.ui),
      },
      {
        name: 'שלח SMS להזמנה',
        click: async (e) => {
          await e.sendInviteSmsToUser(document.location.origin)
        },
      },
      {
        name: 'שלח Whatsapp להזמנה',
        click: async (e) => {
          sendWhatsappToPhone(
            e.phone,
            e.buildInviteText(document.location.origin)
          )
        },
      },
      {
        name: 'הצג קוד חד פעמי',
        click: async (e) => {
          await this.ui.error(await SignInController.getOtpFor(e.phone))
        },
      },
    ],
    confirmDelete: async (h) => {
      return await this.ui.confirmDelete(h.name)
    },
  })
  async addVolunteer() {
    const v = repo(User).create()
    v.editDialog(this.ui, () => {
      setTimeout(() => {
        const index = this.users.items.findIndex((x) => x.id == v.id)
        if (index >= 0) this.users.items.splice(index, 1)
        this.users.items.splice(0, 0, v)
      }, 300)
    })
  }

  ngOnInit() {}
}
//[ ] add change log
