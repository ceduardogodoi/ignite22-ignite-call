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

  const blockedDatesRaw = await prisma.$queryRaw`
    SELECT
      EXTRACT(DAY FROM S.date) AS date,
      COUNT(S.date) AS amount,
      (UTI.time_start_in_minutes - UTI.time_end_in_minutes) / 60 AS size
    FROM schedulings S

    LEFT JOIN user_time_intervals UTI
      ON UTI.week_day = WEEKDAY(DATE_ADD(S.date, INTERVAL 1 DAY))

    WHERE S.user_id = ${user.id}
      AND DATE_FORMAT(S.date, "%Y-%m") = ${`${year}-${month}`}

    GROUP BY EXTRACT(DAY FROM S.date),
      (UTI.time_start_in_minutes - UTI.time_end_in_minutes) / 60
  `

  console.log(blockedDatesRaw)

  // VÍDEO PAROU EM 05:52

  return response.json({ blockedWeekDays })
}
