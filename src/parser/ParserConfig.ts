import { NativeConfig, NativeParser } from './ParserLib';

import { Namespace } from '../Namespace';
import { ParserNamespace } from './ParserNamespace';
import { TokenSpace } from '../tokenizer/TokenSpace';
import { TokenSet } from '../tokenizer/TokenSet';
import { InternalToken } from './InternalToken';
import { TokenKind } from './Token';
import { Parser } from './Parser';

/** Parser configuration for quickly instantiating new parsers.
  * Each parser instance holds a new, cloned copy. */

export class ParserConfig {

	constructor(parent?: ParserConfig, native?: NativeConfig) {
		this.isIndependent = !parent;

		if(parent) {
			this.uriSpace = parent.uriSpace;
			this.prefixSpace = parent.prefixSpace;
			this.elementSpace = parent.elementSpace;
			this.attributeSpace = parent.attributeSpace;

			this.uriSet = parent.uriSet;
			this.prefixSet = parent.prefixSet;

			this.namespaceList = parent.namespaceList;
			this.namespaceTbl = parent.namespaceTbl;
		} else {
			this.uriSpace = new TokenSpace(TokenKind.uri);
			this.prefixSpace = new TokenSpace(TokenKind.prefix);
			this.elementSpace = new TokenSpace(TokenKind.element);
			this.attributeSpace = new TokenSpace(TokenKind.attribute);

			this.uriSet = new TokenSet(this.uriSpace);
			this.prefixSet = new TokenSet(this.prefixSpace);

			this.namespaceList = [];
			this.namespaceTbl = {};
		}

		this.native = native || new NativeConfig(this.prefixSet.createToken('xmlns').id);
	}

	makeIndependent() {
		if(this.isIndependent) return;
		this.isIndependent = true;

		this.uriSpace = new TokenSpace(TokenKind.uri, this.uriSpace);
		this.prefixSpace = new TokenSpace(TokenKind.prefix, this.prefixSpace);
		this.elementSpace = new TokenSpace(TokenKind.element, this.elementSpace);
		this.attributeSpace = new TokenSpace(TokenKind.attribute, this.attributeSpace);

		this.uriSet = new TokenSet(this.uriSpace, this.uriSet);
		this.prefixSet = new TokenSet(this.prefixSpace, this.prefixSet);

		const namespaceTbl: { [ name: string ]: ParserNamespace } = {};
		for(let key of Object.keys(this.namespaceTbl)) {
			namespaceTbl[key] = this.namespaceTbl[key];
		}

		this.namespaceList = this.namespaceList.slice(0);
		this.namespaceTbl = namespaceTbl;
	}

	createParser() {
		const nativeParser = new NativeParser(this.native);
		const config = new ParserConfig(this, nativeParser.getConfig());

		return(new Parser(config, nativeParser));
	}

	addNamespace(nsBase: Namespace) {
		if(this.namespaceTbl[nsBase.uri]) return;
		if(!this.isIndependent) this.makeIndependent();

		const nsParser = new ParserNamespace(nsBase, this);
		nsParser.id = this.native.addNamespace(nsParser.registerNative());
		nsParser.uri = this.addUri(nsBase.uri, nsParser);
		if(nsBase.defaultPrefix) {
			nsParser.defaultPrefix = this.addPrefix(nsBase.defaultPrefix);
		}

		this.namespaceList[nsParser.id] = nsParser;
		this.namespaceTbl[nsBase.uri] = nsParser;
	}

	bindNamespace(ns: Namespace | ParserNamespace) {
		if(ns instanceof Namespace) {
			const base = ns;
			while(!(ns = this.namespaceTbl[base.uri])) this.addNamespace(base);
		}

		const prefix = ns.defaultPrefix;

		if(prefix) this.native.bindPrefix(prefix.id, ns.uri.id);
	}

	bindPrefix(prefix: InternalToken, uri: InternalToken) {
		this.native.bindPrefix(prefix.id, uri.id);
	}

	addUri(uri: string, ns: ParserNamespace) {
		if(!this.isIndependent) this.makeIndependent();

		const token = this.uriSet.createToken(uri);

		this.native.setUriTrie(this.uriSet.encodeTrie());
		this.native.addUri(token.id, ns.id);

		return(token);
	}

	addPrefix(prefix: string) {
		if(!this.isIndependent) this.makeIndependent();

		const token = this.prefixSet.createToken(prefix);

		this.native.setPrefixTrie(this.prefixSet.encodeTrie());

		return(token);
	}

	private isIndependent: boolean;

	private native: NativeConfig;

	/** Allocates ID numbers for xmlns uri tokens. */
	uriSpace: TokenSpace;
	/** Allocates ID numbers for xmlns prefix tokens. */
	prefixSpace: TokenSpace;
	/** Allocates ID numbers for element name tokens. */
	elementSpace: TokenSpace;
	/** Allocates ID numbers for attribute name tokens. */
	attributeSpace: TokenSpace;

	uriSet: TokenSet;
	prefixSet: TokenSet;

	/** List of supported namespaces. */
	namespaceList: ParserNamespace[];
	/** Mapping from URI to namespace. */
	namespaceTbl: { [ uri: string ]: ParserNamespace };

}