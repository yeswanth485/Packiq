import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const trackingNumber = searchParams.get('tracking_number')
    // Optionally a carrier slug if known, else AfterShip might auto-detect if configured, 
    // or we can use a generic approach depending on the plan.
    const slug = searchParams.get('slug') || 'fedex' // fallback to a default carrier or require it
    
    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 })
    }

    const API_KEY = process.env.AFTERSHIP_API_KEY
    if (!API_KEY) {
      return NextResponse.json({ 
        error: 'AFTERSHIP_API_KEY is not configured in environment variables. Please add it to get real data.' 
      }, { status: 500 })
    }

    // Call real AfterShip API
    const response = await fetch(`https://api.aftership.com/v4/trackings/${slug}/${trackingNumber}`, {
      headers: {
        'aftership-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      // If the tracking doesn't exist, Aftership returns an error.
      // Often you have to POST a tracking number first to add it to your account before GETting it.
      // But we will just pass the error back to the user.
      throw new Error(data.meta?.message || 'Failed to fetch tracking data')
    }

    // Transform AfterShip data into a standard timeline format for our UI
    const tracking = data.data.tracking
    const checkpoints = tracking.checkpoints.map((cp: any) => ({
      status: cp.tag, // 'InfoReceived', 'InTransit', 'OutForDelivery', 'Delivered'
      message: cp.message,
      location: [cp.city, cp.state, cp.country_name].filter(Boolean).join(', '),
      timestamp: cp.checkpoint_time
    }))

    return NextResponse.json({
      tracking_number: tracking.tracking_number,
      carrier: tracking.slug,
      status: tracking.tag,
      checkpoints
    })
    
  } catch (error: any) {
    console.error('Tracking API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
