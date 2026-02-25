"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphiQLPlaygroundPlugin = void 0;
const graphiql_html_factory_1 = require("./graphiql-html.factory");
class GraphiQLPlaygroundPlugin {
    constructor(options) {
        this.options = options;
        this.graphiqlHTMLFactory = new graphiql_html_factory_1.GraphiQLHTMLFactory();
    }
    async serverWillStart() {
        const html = this.graphiqlHTMLFactory.create(this.options);
        return {
            async renderLandingPage() {
                return { html };
            },
        };
    }
}
exports.GraphiQLPlaygroundPlugin = GraphiQLPlaygroundPlugin;
