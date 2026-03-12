# Teacher Search Implementation

This document describes the implementation of the teacher search functionality.

## Overview

The teacher search feature allows students to find teachers based on various criteria including:
- Keyword search (teacher name)
- Subject filters
- Price range
- Minimum rating
- Experience years (UI only, not yet implemented in backend)
- Sorting options (rating, price, newest)

## Components

### 1. TeacherSearchScreen (`screens/TeacherSearchScreen.tsx`)

Main search screen accessible from the bottom tab navigation.

**Features:**
- Real-time search with 500ms debounce
- Sort by: rating (default), price, newest
- Filter button to open advanced filters
- Displays teacher cards with:
  - Avatar/profile image
  - Name and age
  - Specialty
  - Rating and review count
  - Price per hour
  - Favorite button

**State Management:**
- `searchQuery`: Current search text input
- `sortType`: Current sort option (rating/price/new)
- `filters`: Applied filter parameters from SearchFilterScreen
- Route params are used to receive filters from SearchFilterScreen

**API Integration:**
```typescript
apiService.searchTeachers({
  q: searchQuery,
  subjects: filters.subjects?.join(','),
  priceMax: filters.priceMax,
  ratingMin: filters.ratingMin,
  sortBy,
  sortOrder,
  limit: 20,
});
```

### 2. SearchFilterScreen (`screens/SearchFilterScreen.tsx`)

Advanced filter screen accessible from TeacherSearchScreen filter button.

**Filter Options:**
- Keyword search
- Subject selection (multi-select with groups)
- Price range slider (¥1,000 - ¥20,000)
- Minimum rating (1-5 stars)
- Experience years (chips selection)

**Navigation Flow:**
1. Opens with current filters pre-populated from TeacherSearchScreen
2. User adjusts filters
3. "検索" button navigates back to TeacherSearchScreen with new filters
4. "リセット" button clears all filters

### 3. Backend API (`/api/student/teachers/search`)

Endpoint: `GET /api/student/teachers/search`

**Query Parameters:**
- `q` (string): Search query for name/email
- `subjects` (string): Comma-separated list of subjects
- `priceMin` (number): Minimum price per hour
- `priceMax` (number): Maximum price per hour
- `ratingMin` (number): Minimum rating (0-5)
- `gender` (string): Filter by gender
- `sortBy` (string): Field to sort by (rating/price/reviewCount/createdAt)
- `sortOrder` (string): Sort order (asc/desc)
- `page` (number): Page number for pagination
- `limit` (number): Results per page

**Response:**
```typescript
{
  success: true,
  data: {
    teachers: [
      {
        id: string,
        name: string,
        age: number,
        specialty: string,
        subjects: string[],
        rating: number,
        reviewCount: number,
        pricePerHour: number,
        favorites: string,
        isFavorite: boolean,
        avatarUrl: string | null,
        avatarColor: string
      }
    ],
    pagination: {
      currentPage: number,
      totalPages: number,
      totalItems: number,
      hasNext: boolean,
      hasPrev: boolean
    }
  }
}
```

## Type Definitions

### SearchFilterParams

Shared interface for filter parameters across navigation:

```typescript
export interface SearchFilterParams {
  keyword?: string;
  subjects?: string[];
  priceMax?: number;
  ratingMin?: number;
  experienceYears?: string;
}
```

### Navigation Parameters

```typescript
// MainTabParamList
TeacherSearch: {
  filters?: SearchFilterParams;
}

// MainStackParamList
SearchFilter: {
  currentFilters?: SearchFilterParams;
}
```

## Search Flow

1. **Initial Load:**
   - TeacherSearchScreen loads with default sort (rating, descending)
   - Fetches first 20 teachers with highest rating

2. **Keyword Search:**
   - User types in search box
   - 500ms debounce delays the API call
   - Searches teacher names containing the keyword
   - Results update automatically

3. **Sort Toggle:**
   - User taps sort button (評価順/料金順/新着順)
   - Immediate API call with new sort parameter
   - Results update with new ordering

4. **Advanced Filters:**
   - User taps filter icon
   - Opens SearchFilterScreen with current filters
   - User adjusts filters and taps "検索"
   - Navigates back with new filters
   - TeacherSearchScreen receives filters via route params
   - Triggers new search with combined filters

5. **Filter Reset:**
   - User taps "リセット" in SearchFilterScreen
   - All filters cleared to defaults
   - Can either search with defaults or go back

## Implementation Notes

### Real-time Search

The search input uses a debounced effect to prevent excessive API calls:

```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (searchQuery !== (route.params?.filters?.keyword || '')) {
      fetchTeachers();
    }
  }, 500);

  return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchQuery]);
```

The condition `searchQuery !== route.params?.filters?.keyword` prevents duplicate searches when returning from SearchFilterScreen with the same keyword.

### Filter Persistence

Filters are passed through navigation params, ensuring they persist when:
- Navigating to SearchFilterScreen and back
- Opening filter screen pre-populates current filters
- Keyword from search input is included in filters

### Backend Search Logic

The backend uses Drizzle ORM with PostgreSQL:
- Text search uses `ILIKE` for case-insensitive matching
- Subject filtering uses `unnest()` for array column search
- Price and rating use numeric comparisons
- Pagination applied after filtering and sorting

## Future Enhancements

1. **Experience Years Filter:**
   - Currently collected in UI but not sent to backend
   - Backend needs to implement experience years filtering

2. **Gender Filter:**
   - Backend supports it but not exposed in UI yet
   - Can add to SearchFilterScreen

3. **Pagination:**
   - Currently loads first 20 results
   - Can add "Load More" or infinite scroll

4. **Search History:**
   - Save recent searches locally
   - Show suggestions based on history

5. **Popular Searches:**
   - Track popular search terms
   - Show trending teachers or subjects

## Testing

### Manual Testing Checklist

- [ ] Search by teacher name
- [ ] Search with no results
- [ ] Apply subject filter
- [ ] Apply price range filter
- [ ] Apply rating filter
- [ ] Combine multiple filters
- [ ] Sort by rating
- [ ] Sort by price
- [ ] Sort by newest
- [ ] Reset filters
- [ ] Navigate between search and filter screens
- [ ] Verify filter state persists

### Edge Cases to Test

- Empty search query
- Very long search query
- Special characters in search
- Price range at min/max values
- All subjects selected
- No filters applied
- Network errors during search
