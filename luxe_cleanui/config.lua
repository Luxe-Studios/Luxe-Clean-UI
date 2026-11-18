Config = {}

-- Accent colour. Uses the player's /notify colour (Luxe Clean Notify) or Luxe Clean HUD's when those run.
Config.Accent = '#e8e6e1'

-- 'glass' (see-through blur) or 'solid'. Follows /notify's style when Luxe Clean Notify runs.
Config.Background = 'glass'

Config.Menus = {
    -- Let players walk / drive while a context menu, list menu or radial menu is open.
    -- (Input & alert dialogs always lock movement so typing doesn't move you.)
    allowMovement = true,
}

-- [E] prompts (lib.showTextUI): 'left' | 'right' | 'top' | 'bottom'.
-- 'auto' = wherever the script asked for.
Config.TextUI = { position = 'auto' }

Config.Radial = {
    style = 'minimal',   -- 'minimal' (floating buttons) | 'ring' (dark ring behind)
    scale = 1.0,
}
