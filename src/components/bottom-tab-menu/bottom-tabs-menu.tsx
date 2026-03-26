"use client"

import { BookIcon, GiftIcon, HeartIcon } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TelegramUserCard } from '../telegram-user-card'

const tabs = [
    {
        name: 'Explore',
        value: 'explore',
        icon: BookIcon,
        content: (
            <>
                {/* <TelegramUserCard user={{ id: 1, first_name: "ssije", last_name: "dwuehdiuw", is_premium: false, language_code: "uz", photo_url }} /> */}
            </>
        )
    },
    {
        name: 'Favorites',
        value: 'favorites',
        icon: HeartIcon,
        content: (
            <>
                All your <span className='text-foreground font-semibold'>favorites</span> are saved here. Revisit articles,
                collections, and moments you love, any time you want a little inspiration.
            </>
        )
    },
    {
        name: 'Surprise Me',
        value: 'surprise',
        icon: GiftIcon,
        content: (
            <>
                <span className='text-foreground font-semibold'>Surprise!</span> Here&apos;s something unexpected—a fun fact, a
                quirky tip, or a daily challenge. Come back for a new surprise every day!
            </>
        )
    }
]

const BottomTabsMenu = () => {
    return (
        <div className='w-full'>
            <Tabs defaultValue='explore' className='gap-4'>
                {tabs.map(tab => (
                    <TabsContent key={tab.value} value={tab.value}>
                        {tab.content}
                    </TabsContent>
                ))}
                <TabsList className='w-full h-auto justify-around bg-background border-0'>
                    {tabs.map(({ icon: Icon, name, value }) => (
                        <TabsTrigger key={value} value={value} className='flex flex-col items-center gap-1 px-2.5 sm:px-3'>
                            <Icon size={20} />
                            <span className='text-xs'>{name}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

            </Tabs>
        </div>
    )
}

export default BottomTabsMenu
