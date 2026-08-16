import './style.css'

import { App } from './core/app'

(() => {

  const app = new App()
  app.start()

  const animate = () => {
    app.update()
    
    requestAnimationFrame(animate)
  }

  animate()

})();