import { createEvents } from 'ics'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const admin = createAdminClient()

    // 1. Busca a escola pelo slug
    const { data: escola } = await admin
      .from('escolas')
      .select('id, nome')
      .eq('slug', params.slug)
      .maybeSingle()

    if (!escola) {
      return new NextResponse('Escola não encontrada.', { status: 404 })
    }

    // 2. Busca todos os eventos futuros
    const hoje = new Date().toISOString().split('T')[0]
    const { data: eventos } = await admin
      .from('eventos')
      .select('id, titulo, descricao, data_evento, hora_evento')
      .eq('escola_id', escola.id)
      .eq('ativo', true)
      .gte('data_evento', hoje)
      .order('data_evento', { ascending: true })

    if (!eventos || eventos.length === 0) {
      return new NextResponse('Nenhum evento futuro agendado.', { status: 404 })
    }

    // 3. Converte para o formato do ics
    const icsEvents = eventos.map((e) => {
      const [year, month, day] = e.data_evento.split('-').map(Number)
      
      let start: [number, number, number, number, number]
      if (e.hora_evento) {
        const [hour, minute] = e.hora_evento.split(':').map(Number)
        start = [year, month - 1, day, hour, minute]
      } else {
        // Se não tem hora, coloca 08:00 como padrão
        start = [year, month - 1, day, 8, 0]
      }

      return {
        start,
        duration: { hours: 1, minutes: 30 },
        title: e.titulo,
        description: e.descricao || `Evento da escola ${escola.nome}`,
        location: escola.nome,
        status: 'CONFIRMED' as const,
        busyStatus: 'BUSY' as const,
      }
    })

    // 4. Gera o arquivo .ics
    const { error, value } = createEvents(icsEvents)

    if (error) {
      console.error('Erro ao gerar ICS:', error)
      return new NextResponse('Erro ao gerar calendário.', { status: 500 })
    }

    // 5. Retorna o arquivo para download / assinatura
    return new NextResponse(value, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="agenda-${params.slug}.ics"`,
      },
    })
  } catch (e) {
    console.error('Erro na API ICS:', e)
    return new NextResponse('Erro interno.', { status: 500 })
  }
}