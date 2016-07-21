import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import r from '../../db/connect'
import {updateTeamECCStats} from '../../server/actions/updateTeamECCStats'
import {getProjectsForChapterInCycle} from '../../server/db/project'

export function start() {
  const cycleCompleted = getQueue('cycleCompleted')
  cycleCompleted.process(({data: cycle}) =>
      processCompletedCycle(cycle)
      .catch(err => console.error(`Error handling cycleCompleted event for ${cycle.id}:`, err))
  )
}

export async function processCompletedCycle(cycle, chatClient = new ChatClient()) {
  console.log(`Completing cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  await updateECC(cycle)
  await sendCompletionAnnouncement(cycle, chatClient)
}

function updateECC(cycle) {
  return getProjectsForChapterInCycle(cycle.chapterId, cycle.id)
    .then(projects =>
      Promise.all(
        projects.map(project => updateTeamECCStats(project, cycle.id))
      )
    )
}

function sendCompletionAnnouncement(cycle, chatClient) {
  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => {
      const announcement = `✅ *Cycle ${cycle.cycleNumber} is complete*.`
      return chatClient.sendMessage(chapter.channelName, announcement)
    })
}