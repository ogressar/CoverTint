import { FormModal, IconButton, Tooltip, defineAddon, logger, notifications, openModal, storage, useCurrentTrack } from '@pulsesync/addon-sdk'

import addonConfig from '../addon.config.mjs'
import { settings } from './settings'

function PlayerBarButton() {
    const { enabled } = settings.use()
    const track = useCurrentTrack()

    if (!enabled) return null

    const confirmTrack = () => openModal(props => (
        <FormModal
            {...props}
            title="Заметка о треке"
            subtitle={track?.title ? `Заметка для «${track.title}»` : 'Проверка нативных полей SDK'}
            fields={[
                { type: 'text', name: 'note', label: 'Заметка', placeholder: 'Минимум 3 символа', required: true, minLength: 3, maxLength: 200 },
                { type: 'switch', name: 'favorite', label: 'Отметить в данных аддона', value: false },
                { type: 'select', name: 'category', label: 'Категория', required: true, options: [
                    { value: 'listen', label: 'Переслушать' },
                    { value: 'saved', label: 'Сохранить на потом' },
                ] },
            ]}
            submitText="Сохранить"
            cancelText="Отмена"
            onSubmit={async (values, signal) => {
                await storage.set('lastCheck', { trackId: track?.id ?? null, ...values, checkedAt: Date.now() })
                signal.throwIfAborted()
                await notifications.info(`Сохранено: ${values.note}`)
            }}
        />
    ))

    return <Tooltip content="Проверить SDK">
        <IconButton icon="info" label="Проверить SDK" variant="text"
            onClick={async () => {
                try {
                    await confirmTrack()
                } catch (error) {
                    if (error instanceof Error && error.name === 'AbortError') return
                    logger.error('Модалка закрыта с ошибкой', error)
                }
            }} />
    </Tooltip>
}

export default defineAddon({
    id: addonConfig.id,
    name: addonConfig.name,
    settings,
    slots: {
        playerBarButton: PlayerBarButton,
    },
    trackMenuItems: [
        {
            id: 'check-webhost',
            label: 'Проверить WebHost',
            icon: 'info',
            position: 1,
            onClick: ({ track }) => {
                const album = track.albumId ? `, album ${track.albumId}` : ''
                return notifications.info(`Track ${track.id}${album}`)
            },
        },
    ],
})
