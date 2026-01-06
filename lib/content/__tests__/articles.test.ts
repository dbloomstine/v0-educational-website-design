import { describe, it, expect } from 'vitest'
import {
  articles,
  getArticlesByFundType,
  getArticleByPillar,
  getRelatedArticles,
} from '../articles'

describe('articles', () => {
  describe('articles registry', () => {
    it('should contain articles', () => {
      expect(Object.keys(articles).length).toBeGreaterThan(0)
    })

    it('should have valid article structure', () => {
      const firstArticle = Object.values(articles)[0]
      expect(firstArticle).toHaveProperty('id')
      expect(firstArticle).toHaveProperty('title')
      expect(firstArticle).toHaveProperty('slug')
      expect(firstArticle).toHaveProperty('fundType')
      expect(firstArticle).toHaveProperty('pillar')
      expect(firstArticle).toHaveProperty('content')
    })
  })

  describe('getArticlesByFundType', () => {
    it('should return articles for private-equity', () => {
      const peArticles = getArticlesByFundType('private-equity')
      expect(peArticles.length).toBeGreaterThan(0)
      peArticles.forEach(article => {
        expect(article.fundType).toBe('private-equity')
      })
    })

    it('should return empty array for invalid fund type', () => {
      const noArticles = getArticlesByFundType('invalid-fund-type')
      expect(noArticles).toEqual([])
    })
  })

  describe('getArticleByPillar', () => {
    it('should return article for valid fund type and pillar', () => {
      const article = getArticleByPillar('private-equity', 'cfo')
      expect(article).toBeDefined()
      expect(article?.fundType).toBe('private-equity')
      expect(article?.pillar).toBe('cfo')
    })

    it('should return undefined for invalid combination', () => {
      const article = getArticleByPillar('invalid', 'invalid')
      expect(article).toBeUndefined()
    })
  })

  describe('getRelatedArticles', () => {
    it('should return related articles', () => {
      const peArticle = getArticleByPillar('private-equity', 'cfo')
      if (peArticle) {
        const related = getRelatedArticles(peArticle, 3)
        expect(related.length).toBeLessThanOrEqual(3)
        // Should not include the original article
        expect(related.find(a => a.id === peArticle.id)).toBeUndefined()
      }
    })
  })
})
