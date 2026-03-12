# Visual Changes Guide

## Admin Panel Changes

### Plan Creation/Edit Dialog

**New Field Added**: A checkbox labeled "追加オプション" (Additional Option)

**Location**: In the plan creation/edit form, after the "有効" (Active) toggle

**Visual Structure**:
```
┌─────────────────────────────────────────┐
│  新規プラン作成 / プランを編集           │
├─────────────────────────────────────────┤
│  名前（日本語）: [____________]          │
│  名前（英語）:   [____________]          │
│  説明:          [____________]          │
│  価格（円）:     [____________]          │
│  レッスン数合計: [____________]          │
│  期間（日数）:   [____________]          │
│  表示順:        [____________]          │
│  機能:          [____________]          │
│                 [____________]          │
│                                         │
│  ☑ 有効                                 │
│  ☐ 追加オプション  ← NEW!              │
│                                         │
│  [キャンセル]  [保存]                   │
└─────────────────────────────────────────┘
```

**Behavior**:
- Checkbox is unchecked by default
- When checked, the plan will be treated as an additional option
- When unchecked, the plan is a regular monthly plan

---

## Mobile App Changes

### Plan Selection Screen

**Tab Behavior Changed**:

**Before**: 
- "月額プラン" tab: Shows all active plans from API
- "追加オプション" tab: Shows hardcoded option (授業追加購入)

**After**:
- "月額プラン" tab: Shows only plans where `isAdditionalOption = false`
- "追加オプション" tab: Shows only plans where `isAdditionalOption = true` (fetched from API)

**Visual Structure**:
```
┌─────────────────────────────────────────┐
│         プランを選択                    │
├─────────────────────────────────────────┤
│  [月額プラン]  [追加オプション]         │
│  ───────────                            │
│                                         │
│  When "追加オプション" tab is selected: │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ○ 授業追加購入                  │   │
│  │   ¥6,000 /回                    │   │
│  │   追加で1回分のレッスンを購入で │   │
│  │   きます                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  (If no options available)              │
│  ┌─────────────────────────────────┐   │
│  │   現在、追加オプションはありませ │   │
│  │   ん                            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Field Mapping for Additional Options

When creating an additional option plan in the admin panel, note that fields are repurposed:

| Admin Panel Field | Display Location on Mobile |
|-------------------|---------------------------|
| 名前 (Name) | Option title |
| 価格 (Price) | Price amount |
| 説明 (Description) | ⚠️ **Unit** (e.g., "回") |
| 機能 (Features) 1st line | ⚠️ **Description text** |

**Example**:
```
Admin Input:
- Name: "授業追加購入"
- Price: 6000
- Description: "回"  ← This becomes the unit!
- Features: "追加で1回分のレッスンを購入できます"  ← This becomes the description!

Mobile Display:
┌──────────────────────┐
│ ○ 授業追加購入        │
│   ¥6,000 /回         │  ← "回" from Description field
│   追加で1回分のレ... │  ← From Features[0]
└──────────────────────┘
```

---

## User Flow Example

### Creating an Additional Option

1. **Admin logs in** → Goes to Plans page
2. **Clicks "プランを追加"**
3. **Fills in**:
   - Name: "授業追加購入"
   - Price: 6000
   - Total Lessons: 1
   - Description: "回"
   - Features: "追加で1回分のレッスンを購入できます"
4. **✅ Checks "追加オプション"**
5. **✅ Enables "有効"**
6. **Clicks "保存"**

### User Sees the Option

1. **User opens mobile app** → Goes to Plan Selection
2. **Clicks "追加オプション" tab**
3. **Sees the new option**:
   - Title: "授業追加購入"
   - Price: "¥6,000 /回"
   - Description: "追加で1回分のレッスンを購入できます"
4. **Can select and purchase**

---

## Empty State

If no additional options exist, users see:
```
┌─────────────────────────────────┐
│                                 │
│   現在、追加オプションはありま  │
│   せん                          │
│                                 │
└─────────────────────────────────┘
```

This provides clear feedback instead of showing an empty list.
