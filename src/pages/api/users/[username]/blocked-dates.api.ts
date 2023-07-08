import { NextApiRequest, NextApiResponse } from 'next'
// import dayjs from 'dayjs'

import { prisma } from '../../../../lib/prisma'

export default async function handle(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  if (request.method !== 'GET') {
    return response.status(405).end()
  }

  const { year, month } = request.query
  if (!year || !month) {
    return response.status(400).json({
      message: 'Year or month not specified.',
    })
  }

  const username = String(request.query.username)

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  })
  if (!user) {
    return response.status(400).json({
      message: 'User does not exist.',
    })
  }

  const availableWeekDays = await prisma.userTimeInterval.findMany({
    select: {
      week_day: true,
    },
    where: {
      user_id: user.id,
    },
  })

  const blockedWeekDays = [0, 1, 2, 3, 4, 5, 6].filter((weekDay) => {
    return !availableWeekDays.some(
      (availableWeekDay) => availableWeekDay.week_day === weekDay,
    )
  })

  return response.json({ blockedWeekDays })
}
