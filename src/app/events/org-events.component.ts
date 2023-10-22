import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core'

import { remult, repo, Unsubscribe } from 'remult'
import { Roles } from '../users/roles'
import { Task } from './tasks'
import { taskStatus } from './taskStatus'
import { UIToolsService } from '../common/UIToolsService'
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs'
import { GridSettings, RowButton } from '../common-ui-elements/interfaces'
import { BusyService, openDialog } from '../common-ui-elements'
import { EventInfoComponent } from '../event-info/event-info.component'
import { ActivatedRoute } from '@angular/router'
import { Location } from '@angular/common'
import { getImageUrl } from './getImageUrl'
import { tripsGrid } from './tripsGrid'

@Component({
  selector: 'app-org-events',
  templateUrl: './org-events.component.html',
  styleUrls: ['./org-events.component.scss'],
})
export class OrgEventsComponent implements OnInit {
  constructor(
    private tools: UIToolsService,
    private busy: BusyService,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  @ViewChild('tabGroup')
  tabGroup!: MatTabGroup
  onTabChange(event: MatTabChangeEvent) {
    if (event.index != this.activeTab) {
      this.activeTab = event.index
      this.loadEvents()
    }
  }

  isDispatcher() {
    return remult.isAllowed(Roles.dispatcher)
  }
  activeTab = 0
  firstLoad = true

  events: Task[] = []
  allRides?: GridSettings<Task>
  onlyShowRelevant = true
  tripId = ''
  async ngOnInit() {
    this.events = []
    this.route.paramMap.subscribe((param) => {
      this.tripId = param.get('id')!
      if (this.tripId) this.activeTab = 1
      this.loadEvents()
    })
  }

  private loadEvents() {
    if (this.activeTab == 2) {
      if (!this.allRides) {
        this.allRides = tripsGrid({
          ui: this.tools,
          busy: this.busy,
          where: () => {
            if (this.onlyShowRelevant)
              return {
                taskStatus: {
                  $ne: [taskStatus.notRelevant, taskStatus.completed],
                },
              }
            return {}
          },
          orderBy: {
            taskStatus: 'desc',
            statusChangeDate: 'desc',
          },
          gridButtons: [
            {
              textInMenu: () =>
                this.onlyShowRelevant ? 'הצג הכל' : 'הצג רק רלוונטיות',
              click: () => {
                this.onlyShowRelevant = !this.onlyShowRelevant
                this.allRides?.reloadData()
              },
            },
          ],
        })
      } else this.allRides.reloadData()
    } else
      repo(Task)
        .find({
          where:
            this.activeTab == 0
              ? {
                  taskStatus: { $ne: taskStatus.draft },
                  driverId: remult.user!.id,
                }
              : {
                  taskStatus: taskStatus.active,
                },
        })
        .then(async (items) => {
          this.events = items
          if (this.firstLoad) {
            this.firstLoad = false
            if (this.tripId) {
              this.location.replaceState('/')
              let t = items.find((x) => x.id == this.tripId)
              if (!t) {
                t = await repo(Task).findId(this.tripId)
              }
              if (t)
                openDialog(EventInfoComponent, (x) => {
                  x.e = t!
                })
              else this.tools.error('לנסיעה זו כבר משוייך נהג')
            }
            if (this.events.length == 0) this.gotoSearchEvents()
          }
        })
  }

  private gotoSearchEvents() {
    this.tabGroup.selectedIndex = 1
  }
}
