import { describe, expect, it } from 'vitest'
import {
  featuredRelease,
  galleryCards,
  musicCards,
  teamMembers,
} from './site-content'

describe('site-content fallbacks', () => {
  it('exports featured release metadata', () => {
    expect(featuredRelease.title).toBeTruthy()
    expect(featuredRelease.lyric).toBeTruthy()
  })

  it('exports non-empty music and gallery fallbacks', () => {
    expect(musicCards.length).toBeGreaterThan(0)
    expect(galleryCards.length).toBeGreaterThan(0)
  })

  it('exports team member fallbacks', () => {
    expect(teamMembers.length).toBeGreaterThan(0)
    expect(teamMembers[0].name).toBeTruthy()
  })
})
