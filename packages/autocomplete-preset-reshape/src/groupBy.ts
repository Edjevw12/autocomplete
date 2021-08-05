import {
  AutocompleteReshapeFunction,
  AutocompleteSource,
  BaseItem,
  unwrapReshapeSources,
} from '@algolia/autocomplete-core';
import { flatten } from '@algolia/autocomplete-shared';

export type GroupByOptions<
  TItem extends BaseItem,
  TSource extends AutocompleteSource<TItem>
> = {
  getSource(params: { name: string; items: TItem[] }): Partial<TSource>;
};

export const groupBy: AutocompleteReshapeFunction = <
  TItem extends BaseItem,
  TSource extends AutocompleteSource<TItem> = AutocompleteSource<TItem>
>(
  predicate: (value: TItem) => string,
  options: GroupByOptions<TItem, TSource>
) => {
  return function runGroupBy(reshapeExpression) {
    const sources = unwrapReshapeSources(reshapeExpression);

    if (sources.length === 0) {
      return [];
    }

    // Since we create multiple sources from a single one, we take the first one
    // as reference to create the new sources from.
    const referenceSource = sources[0];
    const items = flatten(sources.map((source) => source.getItems()));
    const groupedItems = items.reduce<Record<string, TItem[]>>((acc, item) => {
      const key = predicate(item as TItem);

      if (!acc.hasOwnProperty(key)) {
        acc[key] = [];
      }

      acc[key].push(item as TItem);

      return acc;
    }, {});

    const groupNames = Object.keys(groupedItems);

    return groupNames.map((groupName) => {
      const groupItems = groupedItems[groupName];
      const userSource = options.getSource({
        name: groupName,
        items: groupItems,
      });

      return {
        ...referenceSource,
        sourceId: groupName,
        getItems() {
          return groupItems;
        },
        ...userSource,
        templates: {
          ...((referenceSource as any).templates as any),
          ...(userSource as any).templates,
        },
      };
    });
  };
};
