import { defineAddonSettings, SettingType } from '@pulsesync/addon-sdk'

export const settings = defineAddonSettings(
    {
        enabled: {
            type: SettingType.BOOLEAN,
            name: 'Включить кнопку',
            description: 'Показывает компонент аддона в интерфейсе.',
            default: true,
        },
    },
    { title: 'Основные' },
)
