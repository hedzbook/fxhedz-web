import { NextResponse } from "next/server"

const GAS_URL =
"https://script.google.com/macros/s/AKfycby55ye_dTtWJ-QILNYJIaXWv74_n7n0muh3U--sBl7yowMlp1FzESOokWqeHI75U5_R/exec"

export async function GET(req: Request) {

try{

const { searchParams } = new URL(req.url)

const hash = searchParams.get("hash")

if(!hash){

return NextResponse.json(
{error:"missing hash"},
{status:400}
)

}

const url =
`${GAS_URL}?route=terminal&hash=${encodeURIComponent(hash)}`

const res = await fetch(url,{
method:"GET",
cache:"no-store"
})

if(!res.ok){

return NextResponse.json(
{error:"GAS request failed"},
{status:500}
)

}

const data = await res.json()

return NextResponse.json({

terminal: data.terminal || [],
orders: data.orders || [],
history: data.history || [],
stats: data.stats || []

})

}catch(e){

return NextResponse.json(
{error:"server error"},
{status:500}
)

}

}