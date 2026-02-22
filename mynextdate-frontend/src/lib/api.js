import { supabase } from './supabase'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

export async function getRecommendations(skipIds = []) {
  const params = skipIds.length ? `?skip=${skipIds.join(',')}` : ''
  const res = await fetch(`/api/recommend${params}`, { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to get recommendations')
  return res.json()
}

export async function getWorstRecommendations() {
  const res = await fetch('/api/recommend/worst', { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to get worst recommendations')
  return res.json()
}

export async function getDateHistory() {
  const res = await fetch('/api/dates', { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to get date history')
  return res.json()
}

export async function addDate(activityId, rating = null) {
  const res = await fetch('/api/dates', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ activity_id: activityId, rating }),
  })
  if (!res.ok) throw new Error('Failed to add date')
  return res.json()
}

export async function previewDateMatches(description) {
  const res = await fetch('/api/dates/preview', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ description }),
  })
  if (!res.ok) throw new Error('Failed to preview matches')
  return res.json()
}

export async function addCustomDate(name) {
  const res = await fetch('/api/dates/custom', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to add custom date')
  return res.json()
}

export async function addDateByDescription(description, rating = null) {
  const res = await fetch('/api/dates/describe', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ description, rating }),
  })
  if (!res.ok) throw new Error('Failed to add date')
  return res.json()
}

export async function rateDate(dateId, rating) {
  const res = await fetch(`/api/dates/${dateId}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify({ rating }),
  })
  if (!res.ok) throw new Error('Failed to rate date')
  return res.json()
}

export async function deleteDate(dateId) {
  const res = await fetch(`/api/dates/${dateId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete date')
  return res.json()
}

export async function getActivities() {
  const res = await fetch('/api/activities')
  if (!res.ok) throw new Error('Failed to get activities')
  return res.json()
}

export async function searchActivities(query) {
  const res = await fetch('/api/activities/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error('Failed to search activities')
  return res.json()
}

export async function saveLocation(lat, lng) {
  const res = await fetch('/api/location', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ lat, lng }),
  })
  if (!res.ok) throw new Error('Failed to save location')
  return res.json()
}

export async function getLocalTrends() {
  const res = await fetch('/api/recommend/local', { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to get local trends')
  return res.json()
}

export async function getAnalytics() {
  const res = await fetch('/api/analytics', { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to get analytics')
  return res.json()
}

export async function getCities() {
  const res = await fetch('/api/explore/cities')
  if (!res.ok) throw new Error('Failed to get cities')
  return res.json()
}

export async function getSimilarCouples() {
  const res = await fetch('/api/social/similar', { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to get similar couples')
  return res.json()
}

export async function getCityDimensions() {
  const res = await fetch('/api/explore/city-dimensions')
  if (!res.ok) throw new Error('Failed to get city dimensions')
  return res.json()
}

export async function searchCity(body) {
  const res = await fetch('/api/explore/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to search city activities')
  return res.json()
}
