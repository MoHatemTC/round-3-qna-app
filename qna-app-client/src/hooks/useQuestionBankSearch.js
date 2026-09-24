import { useCallback, useEffect, useState } from "react"
import { getQuestionBankFacets, searchQuestionBank } from "@/services/services"
import { bankQueryString } from "@/lib/questionBank"

// Loads one page of the question bank for the given filters. Typing in the
// search box is debounced; every other filter change loads right away.
export function useQuestionBankSearch(filters, { page, pageSize = 20, excludeQuizId } = {}) {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: pageSize })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState(filters.search)

  useEffect(() => {
    const id = setTimeout(() => setSearch(filters.search), 300)
    return () => clearTimeout(id)
  }, [filters.search])

  const query = bankQueryString({ ...filters, search }, { page, pageSize, excludeQuizId })

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    searchQuestionBank(query)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setError("")
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { ...data, loading, error, reload }
}

// Category and tag values for the filter dropdowns and form suggestions.
export function useQuestionBankFacets() {
  const [facets, setFacets] = useState({ categories: [], tags: [] })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    getQuestionBankFacets()
      .then((result) => {
        if (!cancelled) setFacets(result)
      })
      // Filters still work without suggestions, so a failure here is silent.
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { ...facets, reload }
}
