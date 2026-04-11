/* eslint-disable */
import React from 'react';

export interface ReportTableHeader {
  content: React.ReactNode;
  className?: string;
}

interface ReportTableProps {
  headers: (React.ReactNode | ReportTableHeader)[];
  children: React.ReactNode;
}

export const ReportTable: React.FC<ReportTableProps> = ({ headers, children }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-600 bg-slate-800/50">
            {headers.map((header, index) => {
              const isObject = typeof header === 'object' && header !== null && 'content' in header;
              const content = isObject ? (header).content : header;
              const className = isObject ? (header).className : '';

              return (
                <th
                  key={index}
                  className={`p-3 font-bold ${className}`}
                >
                  {content}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};
