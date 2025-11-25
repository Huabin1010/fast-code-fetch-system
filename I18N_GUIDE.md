# 国际化（i18n）使用指南

本项目已实现中英文切换功能。本文档说明如何使用和管理国际化功能。

## 功能概述

- ✅ 支持中文（zh）和英文（en）两种语言
- ✅ 语言选择会保存在 localStorage 中，刷新后保持
- ✅ 语言切换组件位于页面顶部
- ✅ 所有文本内容都通过翻译系统管理

## 文件结构

```
src/
├── lib/
│   └── i18n/
│       ├── config.ts           # 国际化配置
│       ├── index.ts            # 导出入口
│       └── locales/
│           ├── zh.json         # 中文翻译
│           └── en.json         # 英文翻译
└── components/
    ├── providers/
    │   └── I18nProvider.tsx   # 国际化 Provider
    └── ui/
        └── language-switcher.tsx  # 语言切换组件
```

## 如何在组件中使用翻译

### 1. 导入 useTranslation Hook

```tsx
import { useTranslation } from '@/components/providers/I18nProvider'
```

### 2. 在组件中使用

```tsx
'use client'

export default function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.subtitle')}</p>
    </div>
  )
}
```

### 3. 翻译键的格式

翻译键使用点号分隔的路径，例如：
- `dashboard.title` - 仪表板标题
- `upload.uploadTextContent` - 上传文本内容
- `common.loading` - 加载中

## 添加新的翻译

### 步骤 1: 在语言文件中添加翻译

编辑 `src/lib/i18n/locales/zh.json` 和 `src/lib/i18n/locales/en.json`：

```json
{
  "mySection": {
    "myKey": "我的翻译"
  }
}
```

```json
{
  "mySection": {
    "myKey": "My Translation"
  }
}
```

### 步骤 2: 更新 TypeScript 类型定义

编辑 `src/lib/i18n/config.ts`，添加对应的类型定义：

```typescript
export interface TranslationMessages {
  // ... 现有类型
  mySection: {
    myKey: string
  }
}
```

### 步骤 3: 在组件中使用

```tsx
const { t } = useTranslation()
<h1>{t('mySection.myKey')}</h1>
```

## 语言切换组件

### LanguageSwitcher

下拉选择器形式，显示当前语言，可以切换语言：

```tsx
import { LanguageSwitcher } from '@/components/ui/language-switcher'

<LanguageSwitcher />
```

### LanguageSwitcherButton

按钮形式，点击切换到另一种语言：

```tsx
import { LanguageSwitcherButton } from '@/components/ui/language-switcher'

<LanguageSwitcherButton />
```

## 当前已翻译的内容

- ✅ 登录页面
- ✅ 仪表板页面
- ✅ 上传组件（文件/文本）
- ✅ 通用组件（按钮、标签等）

## 注意事项

1. **所有用户界面文本都应使用翻译函数**：不要硬编码文本
2. **翻译键命名规范**：使用有意义的命名，按功能模块分组
3. **保持翻译文件同步**：确保中英文翻译文件结构一致
4. **类型安全**：更新翻译后记得更新 TypeScript 类型定义

## 添加新语言

如果需要添加其他语言（如日语、法语等）：

1. 创建新的语言文件，如 `src/lib/i18n/locales/ja.json`
2. 在 `src/lib/i18n/config.ts` 中添加语言类型和配置
3. 在 `src/lib/i18n/index.ts` 中导入并添加到 messages 对象
4. 语言切换组件会自动显示新语言选项
