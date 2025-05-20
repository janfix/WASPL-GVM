import { testColumns } from './tests.js';
import { studentColumnsBase } from './students.js';
import { itemColumns } from './items.js';
import { groupColumns } from './groups.js';
import  getPublicationColumns  from './publications.js';
import resultColumns from './results.js';

export const columnPresets = {
  tests: testColumns,
  students: studentColumnsBase,
  items: itemColumns,
  groups:groupColumns,
  publications:getPublicationColumns,
  results:resultColumns
};
