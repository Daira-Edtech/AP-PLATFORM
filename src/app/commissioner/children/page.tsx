'use client'
import { useRouter } from 'next/navigation'
import ChildrenDirectory from '@/components/commissioner/ChildrenDirectory'
export default function ChildrenPage() {
    const router = useRouter()
    return <ChildrenDirectory onChildSelect={(id) => router.push(`/commissioner/children/${id}`)} />
}
