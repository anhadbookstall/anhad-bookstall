// src/components/common/SortableTableCell.js
import React from 'react';
import { TableCell, TableSortLabel } from '@mui/material';

const SortableTableCell = ({ label, field, sortField, sortDir, onSort, sx = {} }) => {
  if (!field) {
    return <TableCell sx={{ color: 'white', fontWeight: 700, ...sx }}>{label}</TableCell>;
  }
  return (
    <TableCell sx={{ color: 'white', fontWeight: 700, ...sx }}>
      <TableSortLabel
        active={sortField === field}
        direction={sortField === field ? sortDir : 'asc'}
        onClick={() => onSort(field)}
        sx={{
          color: 'white !important',
          '& .MuiTableSortLabel-icon': { color: 'white !important' },
          '&.Mui-active': { color: 'white !important' },
        }}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );
};

export default SortableTableCell;