fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'luxe_cleanui'
author 'Luxe Studios'
description 'Luxe Clean UI - clean restyle of ox_lib menus: context, list, radial, input, alert and text UI'
version '1.0.0'

ui_page 'html/index.html'

shared_scripts {
    '@ox_lib/init.lua',
    'config.lua',
}
client_scripts {
    'client/menus.lua',
    'client/main.lua',
}

files {
    'html/index.html',
    'html/style.css',
    'html/menus.js',
    'html/app.js',
    'html/fonts/*.ttf',
    'html/fa/css/*.css',
    'html/fa/webfonts/*.woff2',
}

dependency 'ox_lib'
