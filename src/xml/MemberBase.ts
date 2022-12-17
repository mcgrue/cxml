// This file is part of cxml, copyright (c) 2015-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import {Namespace} from './Namespace';
import {Type} from './Type';
import {TypeSpec} from './TypeSpec';
import {Item, ItemBase} from './Item';
import {MemberRef} from './MemberRef';

// TODO: Should extend ItemBase instead of containing it.
// For now, TypeScript doesn't allow ItemBase to extend ItemContent.

/** Represents a child element or attribute. */

export class MemberBase<
  Member,
  Namespace,
  ItemContent extends ItemBase<Item<ItemContent>>,
> implements Item<ItemContent>
{
  constructor(
    Item: {new (type: MemberBase<Member, Namespace, ItemContent>): ItemContent},
    name: string,
  ) {
    if (Item) this.item = new Item(this);
    this.name = name;
  }

  define() {}

  typeNum: number;
  typeSpec: TypeSpec;
  type: Type;

  /** Substitution group virtual type,
   * containing all possible substitutes as children. */
  proxySpec: TypeSpec;

  /** All types containing this member, to be modified if more substitutions
   * for this member are declared later. */
  containingTypeList: {
    type: TypeSpec;
    head: MemberRef;
    proxy: MemberRef;
  }[];

  item: ItemContent;

  name: string;
  namespace: Namespace;
  safeName: string;

  isAbstract: boolean;
  isSubstituted: boolean;

  static abstractFlag = 1;
  static substitutedFlag = 2;
  static anyFlag = 4;
}
