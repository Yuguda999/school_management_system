import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'react-hot-toast'
import { useEffect } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

function ReloadPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    useEffect(() => {
        if (needRefresh) {
            toast(
                (t) => (
                    <div className="flex items-center gap-4">
                        <span>New content available, click on reload button to update.</span>
                        <button
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            onClick={() => updateServiceWorker(true)}
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            Reload
                        </button>
                        <button
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => {
                                setNeedRefresh(false)
                                toast.dismiss(t.id)
                            }}
                        >
                            Dismiss
                        </button>
                    </div>
                ),
                {
                    duration: 10000,
                    position: 'bottom-right',
                }
            )
        }
    }, [needRefresh, updateServiceWorker, setNeedRefresh])

    return null
}

export default ReloadPrompt
