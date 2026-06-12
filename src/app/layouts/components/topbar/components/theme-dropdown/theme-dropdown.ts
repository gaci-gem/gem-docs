import { Component, inject } from '@angular/core'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { LanguageOptionType, LayoutSkinType } from '@/app/types/layout'
import { LayoutStoreService } from '@core/services/layout-store.service'
import { TitleCasePipe } from '@angular/common'
import { SimplebarAngularModule } from 'simplebar-angular'

const shadcn = 'assets/images/themes/shadcn.svg'
const corporate = 'assets/images/themes/corporate.svg'
const spotify = 'assets/images/themes/spotify.svg'
const saas = 'assets/images/themes/saas.svg'
const nature = 'assets/images/themes/nature.svg'
const vintage = 'assets/images/themes/vintage.svg'
const leafline = 'assets/images/themes/leafline.svg'
const ghibli = 'assets/images/themes/ghibli.svg'
const slack = 'assets/images/themes/slack.svg'
const material = 'assets/images/themes/material.svg'
const flat = 'assets/images/themes/flat.svg'
const pastel = 'assets/images/themes/pastel.svg'
const caffieine = 'assets/images/themes/caffieine.svg'
// const redshift = 'assets/images/themes/redshift.svg'
const gaci = 'assets/images/themes/redshift.svg'

type SkinOptionType = {
  name: LayoutSkinType
  img: string
}

@Component({
  selector: 'app-theme-dropdown',
  imports: [NgbDropdownModule, TitleCasePipe, SimplebarAngularModule],
  templateUrl: './theme-dropdown.html',
  styles: ``,
  standalone: true
})
export class ThemeDropdown {
  private layoutStore = inject(LayoutStoreService)
  skinOptions: SkinOptionType[] = [
    { name: 'shadcn', img: shadcn },
    { name: 'corporate', img: corporate },
    { name: 'spotify', img: spotify },
    { name: 'saas', img: saas },
    { name: 'nature', img: nature },
    { name: 'vintage', img: vintage },
    { name: 'leafline', img: leafline },
    { name: 'ghibli', img: ghibli },
    { name: 'slack', img: slack },
    { name: 'material', img: material },
    { name: 'flat', img: flat },
    { name: 'pastel', img: pastel },
    { name: 'caffieine', img: caffieine },
    { name: 'gaci', img: gaci },
  ]
  get selectedSkin(): LayoutSkinType {
    return this.layoutStore.skin
  }

  setSkin(skin: LayoutSkinType) {
    this.layoutStore.setSkin(skin, true) // persist
  }
}
