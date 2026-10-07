declare module 'moment/locale/*.js' {
  import type { LocaleSpecification } from 'moment'

  const locale: LocaleSpecification
  export = locale
}
