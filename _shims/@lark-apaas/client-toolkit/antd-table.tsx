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
}

export interface TableProps<T = any> {
  columns: ColumnType<T>[];
  dataSource: T[];
  rowKey?: string | ((record: T) => string);
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
}

export function Table<T extends Record<string, any>>({
  columns,
  dataSource,
  loading: _loading,
  className,
  onRow: _onRow,
}: TableProps<T>) {
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

  const rows = dataSource.map((record, idx) => {
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
    return React.createElement(
      'tr',
      { key: idx, className: 'border-t hover:bg-muted/50', ...rowProps },
      ...cells
    );
  });

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
