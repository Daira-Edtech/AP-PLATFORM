import { getQuestions } from './actions'
import QuestionsManager from '@/components/admin/QuestionsManager'

export const metadata = {
    title: 'Questions Bank | Admin',
}

export default async function QuestionsPage() {
    const questions = await getQuestions()

    const domainCounts = questions.reduce<Record<string, number>>((acc, q) => {
        acc[q.domain] = (acc[q.domain] || 0) + 1
        return acc
    }, {})

    return <QuestionsManager questions={questions} domainCounts={domainCounts} />
}
