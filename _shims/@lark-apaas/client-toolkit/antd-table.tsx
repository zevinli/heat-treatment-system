// Shim for @lark-apaas/client-toolkit/antd-table
// Provides antd-like Table component using plain HTML

import React from 'react';

export interface ColumnType<T = any> {
  title: string;
  dataIndex?: string;
  key?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sorter?: boolean | ((a: T, b: T) => number);
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
}

export interface TableProps<T = any> {
  columns: ColumnType<T>[];
  dataSource: T[];
  rowKey?: string | ((record: T, index: number) => React.Key);
  loading?: boolean;
  pagination?: false | {
    current?: number;
    pageSize?: number;
    total?: number;
    onChange?: (page: number, pageSize: number) => void;
    showSizeChanger?: boolean;
    showTotal?: (total: number) => string;
  };
  scroll?: { x?: number | string; y?: number | string };
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  className?: string;
  onChange?: (pagination: any, filters: any, sorter: any) => void;
  onRow?: (record: T) => { onClick?: () => void; style?: React.CSSProperties };
  rowClassName?: (record: T, index: number) => string;
  rowSelection?: {
    type?: 'checkbox' | 'radio' | string;
    selectedRowKeys?: React.Key[];
    onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
    selections?: unknown[];
  };
  expandable?: {
    expandedRowRender: (record: T) => React.ReactNode;
    rowExpandable?: (record: T) => boolean;
    expandRowByClick?: boolean;
  };
}

export function Table<T extends Record<string, any>>({
  columns,
  dataSource,
  loading: _loading,
  className,
  onRow: _onRow,
  rowKey,
  rowClassName,
  rowSelection,
  expandable,
}: TableProps<T>) {
  const [expandedKeys, setExpandedKeys] = React.useState<Set<React.Key>>(new Set());
  if (!dataSource || dataSource.length === 0) {
    return React.createElement(
      'div',
      { className: 'p-8 text-center text-muted-foreground' },
      'No data'
    );
  }

  const headers = columns.map((col) =>
    React.createElement(
      'th',
      {
        key: col.key || (col.dataIndex as string),
        className: 'px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase',
      },
      col.title
    )
  );

  const rows = dataSource.flatMap((record, idx) => {
    const resolvedKey = typeof rowKey === 'function'
      ? rowKey(record, idx)
      : rowKey ? record[rowKey] : idx;
    const selected = rowSelection?.selectedRowKeys?.includes(resolvedKey) ?? false;
    const selectableRows = dataSource;
    const toggleSelection = () => {
      const current = rowSelection?.selectedRowKeys || [];
      const keys = rowSelection?.type === 'radio'
        ? [resolvedKey]
        : selected ? current.filter(key => key !== resolvedKey) : [...current, resolvedKey];
      rowSelection?.onChange?.(keys, selectableRows.filter((item, itemIndex) => {
        const key = typeof rowKey === 'function' ? rowKey(item, itemIndex) : rowKey ? item[rowKey] : itemIndex;
        return keys.includes(key);
      }));
    };
    const cells = columns.map((col) => {
      const val = col.dataIndex ? record[col.dataIndex] : undefined;
      const rendered = col.render
        ? col.render(val, record, idx)
        : val != null
          ? String(val)
          : '';
      return React.createElement(
        'td',
        { key: col.key || (col.dataIndex as string), className: 'px-4 py-3 text-sm' },
        rendered
      );
    });
    const rowProps = _onRow ? _onRow(record) : {};
    if (rowSelection) {
      cells.unshift(React.createElement('td', { key: '__selection', className: 'px-3 py-3' },
        React.createElement('input', {
          type: rowSelection.type === 'radio' ? 'radio' : 'checkbox',
          checked: selected,
          onChange: toggleSelection,
          onClick: (event: React.MouseEvent) => event.stopPropagation(),
          'aria-label': '选择此行',
        })));
    }
    const canExpand = expandable?.rowExpandable?.(record) ?? Boolean(expandable);
    const toggleExpand = () => {
      if (!canExpand) return;
      setExpandedKeys(current => {
        const next = new Set(current);
        next.has(resolvedKey) ? next.delete(resolvedKey) : next.add(resolvedKey);
        return next;
      });
    };
    const mainRow = React.createElement(
      'tr',
      {
        key: resolvedKey,
        className: `border-t hover:bg-muted/50 ${rowClassName?.(record, idx) || ''}`,
        ...rowProps,
        onClick: (event: React.MouseEvent) => {
          rowProps.onClick?.();
          if (expandable?.expandRowByClick) toggleExpand();
        },
      },
      ...cells
    );
    if (!expandable || !expandedKeys.has(resolvedKey)) return [mainRow];
    return [mainRow, React.createElement('tr', { key: `${String(resolvedKey)}-expanded`, className: 'border-t bg-muted/20' },
      React.createElement('td', { colSpan: columns.length + (rowSelection ? 1 : 0), className: 'p-4' }, expandable.expandedRowRender(record)))];
  });

  if (rowSelection) {
    headers.unshift(React.createElement('th', { key: '__selection', className: 'w-10 px-3 py-3' }));
  }

  return React.createElement(
    'div',
    { className: 'overflow-auto rounded-md border w-full' + (className ? ' ' + className : '') },
    React.createElement(
      'table',
      { className: 'w-full caption-bottom text-sm' },
      React.createElement('thead', { className: 'bg-muted/50' }, React.createElement('tr', null, ...headers)),
      React.createElement('tbody', null, ...rows)
    )
  );
}

Table.SELECTION_COLUMN = {};
Table.EXPAND_COLUMN = {};

export default Table;
