
import { PermisoClave } from "@core/interfaces/rol"
import { PermisoAccion } from "./permisos"

export type LayoutSkinType =
  | 'shadcn'
  | 'corporate'
  | 'spotify'
  | 'saas'
  | 'nature'
  | 'vintage'
  | 'leafline'
  | 'ghibli'
  | 'slack'
  | 'material'
  | 'flat'
  | 'pastel'
  | 'caffieine'
  | 'redshift'
  | 'gaci'

export type LayoutThemeType = 'light' | 'dark' | 'system'

export type TopBarType = {
  color: 'light' | 'dark'
}

export type SideNavType = {
  size: 'default' | 'collapse' | 'offcanvas'
  color: 'light' | 'dark'
  user: boolean
}

export type LayoutPositionType = 'fixed' | 'scrollable'

export type LayoutState = {
  skin: LayoutSkinType
  theme: LayoutThemeType
  position: LayoutPositionType
  topbar: TopBarType
  sidenav: SideNavType
  isLoading: boolean
  monochrome: boolean
}

export type MenuItemType = {
  label: string
  isTitle?: boolean
  icon?: string
  url?: string
  badge?: {
    variant: string
    text: string
  }
  target?: string
  isDisabled?: boolean
  isSpecial?: boolean
  children?: MenuItemType[]
  isCollapsed?: boolean
  permisoClave?:PermisoClave
  permisoAccion?:PermisoAccion
}

export type LanguageOptionType = {
  code: string
  name: string
  nativeName: string
  flag: string
}
