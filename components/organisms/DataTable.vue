<template>
  <div class="w-full">
    <div v-if="searchable" class="mb-4 flex items-center justify-between">
      <SearchBox
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        class="max-w-sm"
      />
      <slot name="actions" />
    </div>
    <div class="rounded-md border">
      <table class="w-full caption-bottom text-sm">
        <thead>
          <tr class="border-b transition-colors hover:bg-muted/50">
            <th
              v-for="column in columns"
              :key="column.key"
              :class="cn(
                'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
                column.class
              )"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in filteredData"
            :key="getRowKey(row, index)"
            class="border-b transition-colors hover:bg-muted/50"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="cn('p-4 align-middle', column.class)"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="row[column.key]"
              >
                {{ formatCellValue(row[column.key], column) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="filteredData.length === 0"
        class="flex h-24 items-center justify-center text-sm text-muted-foreground"
      >
        {{ emptyMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '~/lib/utils'
import SearchBox from '~/components/molecules/SearchBox.vue'

interface Column {
  key: string
  label: string
  class?: string
  formatter?: (value: any) => string
}

interface Props {
  columns: Column[]
  data: any[]
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  emptyMessage?: string
  rowKey?: string | ((row: any) => string)
}

const props = withDefaults(defineProps<Props>(), {
  searchable: false,
  searchPlaceholder: '検索...',
  searchKeys: undefined,
  emptyMessage: 'データがありません',
  rowKey: 'id',
})

const searchQuery = ref('')

const filteredData = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.data
  }

  const query = searchQuery.value.toLowerCase()
  const keys = props.searchKeys || props.columns.map((c) => c.key)

  return props.data.filter((row) => {
    return keys.some((key) => {
      const value = row[key]
      return value != null && String(value).toLowerCase().includes(query)
    })
  })
})

const getRowKey = (row: any, index: number) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey] || index
}

const formatCellValue = (value: any, column: Column) => {
  if (column.formatter) {
    return column.formatter(value)
  }
  return value ?? '-'
}
</script>

