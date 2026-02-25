import { isDefined } from "../../../../utils/helpers.js";
export class SatisfiabilityError extends Error {
    kind;
    sourceGraphName;
    typeName;
    fieldName;
    static forKey(sourceGraphName, targetGraphName, typeName, keyFields) {
        return new SatisfiabilityError("KEY", sourceGraphName, typeName, null, `cannot move to subgraph "${targetGraphName}" using @key(fields: "${keyFields}") of "${typeName}", the key field(s) cannot be resolved from subgraph "${sourceGraphName}".`);
    }
    static forRequire(sourceGraphName, typeName, fieldName) {
        return new SatisfiabilityError("REQUIRE", sourceGraphName, typeName, fieldName, `cannot satisfy @require conditions on field "${typeName}.${fieldName}".`);
    }
    static forExternal(sourceGraphName, typeName, fieldName) {
        return new SatisfiabilityError("EXTERNAL", sourceGraphName, typeName, fieldName, `field "${typeName}.${fieldName}" is not resolvable because marked @external.`);
    }
    static forMissingField(sourceGraphName, typeName, fieldName) {
        return new SatisfiabilityError("MISSING_FIELD", sourceGraphName, typeName, fieldName, `cannot find field "${typeName}.${fieldName}".`);
    }
    static forNoKey(sourceGraphName, targetGraphName, typeName, fieldName) {
        return new SatisfiabilityError("NO_KEY", sourceGraphName, typeName, fieldName, `cannot move to subgraph "${targetGraphName}", which has field "${typeName}.${fieldName}", because type "${typeName}" has no @key defined in subgraph "${targetGraphName}".`);
    }
    static forNoImplementation(sourceGraphName, typeName) {
        return new SatisfiabilityError("NO_IMPLEMENTATION", sourceGraphName, typeName, null, `no subgraph can be reached to resolve the implementation type of @interfaceObject type "${typeName}".`);
    }
    constructor(kind, sourceGraphName, typeName, fieldName, message) {
        super(message);
        this.kind = kind;
        this.sourceGraphName = sourceGraphName;
        this.typeName = typeName;
        this.fieldName = fieldName;
    }
    isMatchingField(typeName, fieldName) {
        if (this.typeName !== typeName) {
            return false;
        }
        if (this.fieldName) {
            return this.fieldName === fieldName;
        }
        return true;
    }
    toString() {
        return this.message;
    }
}
export class LazyErrors {
    lazyError = [];
    add(lazyError) {
        if (lazyError instanceof LazyErrors) {
            this.lazyError.push(...lazyError.getLazyErrors());
            return this;
        }
        this.lazyError.push(lazyError);
        return this;
    }
    getLazyErrors() {
        return this.lazyError;
    }
    toArray() {
        return this.lazyError.flatMap((error) => error.get()).filter(isDefined);
    }
    isEmpty() {
        return this.lazyError.length === 0;
    }
}
