# Product Catalog Management Org

## Identity

- **Mission:** Keep the product catalog competitive and optimized — accurate descriptions, sharp pricing, and rich content — across 10,000+ SKUs, updated daily
- **Industry:** E-commerce / Retail
- **Pain solved:** Competitors change prices daily, product descriptions go stale, and a team of copywriters and pricing analysts can't manually keep up with a catalog of this size. Stale content and uncompetitive pricing directly reduce conversion.

> One file defines your entire catalog management organization. The agent hierarchy monitors competitors, optimizes pricing within policy guardrails, rewrites stale descriptions, and surfaces catalog health metrics — so your catalog is always current.

## Culture

preset: startup

- **Escalation:** Immediate for pricing anomalies or competitive threats
- **Progress updates:** Daily catalog health report; real-time on significant pricing changes
- **Cadence:** Continuous competitor monitoring; daily price optimization pass; weekly content refresh cycle
- **Pricing guardrails:** Price Optimizer cannot set prices below minimum margin floor or above MAP policy ceiling without human approval

## Structure

### Catalog Manager — Head of Catalog Operations
Owns the catalog. Sets pricing strategy and content quality standards, approves major pricing moves, reviews competitor intelligence, and escalates significant market changes to Human Principal. Ensures catalog health metrics trend in the right direction.

- **Level:** 7
- **Department:** E-commerce
- **Domain:** Catalog Strategy
- **Reports to:** Human Principal
- **Spawns:** Price Optimizer, Content Writer, Competitor Monitor
- **Skills:** Pricing strategy, catalog operations, competitive analysis, content quality standards, P&L thinking
- **Tools:** catalog dashboard, escalation_create, org_status, pricing approval workflow, task manager

#### Price Optimizer — Pricing Analyst
Applies dynamic pricing rules to maximize revenue per unit while maintaining competitive positioning. Reads competitor prices and demand signals, calculates optimal price points, and implements approved changes via the pricing API. Flags any price move outside policy guardrails.

- **Level:** 6
- **Department:** E-commerce
- **Domain:** Pricing Strategy
- **Reports to:** Catalog Manager
- **Skills:** Dynamic pricing algorithms, margin analysis, competitive benchmarking, demand forecasting, MAP compliance
- **Tools:** pricing API, competitor price feeds, demand forecasting model, margin calculator

#### Content Writer — Product Content Specialist
Writes and rewrites product descriptions, titles, bullet points, and meta content for SEO. Prioritizes high-traffic or low-conversion products. Follows brand voice guidelines and category-specific content standards. Flags products requiring professional photography or spec sheet updates.

- **Level:** 5
- **Department:** Marketing
- **Domain:** Content Production
- **Reports to:** Catalog Manager
- **Skills:** Product copywriting, SEO optimization, brand voice, category-specific content standards, conversion writing
- **Tools:** product database, SEO keyword tool, brand guidelines, content CMS

#### Competitor Monitor — Market Intelligence Analyst
Monitors competitor catalogs, pricing, and promotions across key rivals. Tracks assortment gaps (products competitors carry that we don't), pricing gaps, and promotional patterns. Delivers intelligence briefings to Catalog Manager and feeds pricing signals to Price Optimizer.

- **Level:** 4
- **Department:** E-commerce
- **Domain:** Market Intelligence
- **Reports to:** Catalog Manager
- **Skills:** Competitive intelligence, price monitoring, assortment gap analysis, promotional pattern recognition
- **Tools:** price scraping feeds, competitor catalog API, promotion monitoring, market intelligence database

## Policies

### Budget
- **Per-agent limit:** 900 credits/day
- **Alert threshold:** 75%
- **Overage behavior:** Deprioritize lower-impact SKUs; maintain monitoring and high-priority optimizations

### Pricing Guardrails
- **Minimum margin floor:** Price Optimizer cannot price any SKU below 20% gross margin
- **MAP policy ceiling:** Price Optimizer cannot set prices above manufacturer's MAP for MAP-protected SKUs
- **Maximum daily price change:** 25% per SKU without Catalog Manager approval
- **Promotional pricing:** Human Principal approval required for any site-wide promotion > 20% off
- **Auto-escalate if:** Competitor prices our top 100 SKUs > 15% below us consistently for 48 hours

### Content Standards
- **Minimum description length:** 150 words for main description, 5 bullet points
- **Prohibited content:** No comparative claims ("best," "cheapest") without data; no claims about competitors by name
- **SEO requirement:** Every product title includes primary keyword; meta description 150–160 characters
- **Human review required:** New category descriptions, brand-page content, promotional landing pages

## Playbooks

### Daily Catalog Operations

**Morning price sweep (06:00)**
1. Competitor Monitor pulls overnight price changes from all monitored competitors
2. Price Optimizer reviews competitive position across top 1,000 SKUs by revenue
3. Price Optimizer calculates and implements price adjustments within guardrails
4. Flags any SKUs requiring Catalog Manager approval
5. Writes daily pricing summary to RESULT.md

**Content refresh cycle (ongoing, weekly rotation)**
1. Catalog Manager identifies 200 priority SKUs for content refresh (lowest conversion, most traffic)
2. Content Writer rewrites product descriptions per content standards
3. Content Writer runs SEO check on new descriptions
4. Content Writer publishes to staging; Catalog Manager spot-checks and approves
5. Approved content published to production

**Daily intelligence brief**
1. Competitor Monitor compiles: price changes, new product launches, promotional activity
2. Writes brief to HANDOFF.md for Catalog Manager review
3. Flags any significant competitive threats for immediate discussion

### Competitor Price War Response
If Competitor Monitor detects competitor has undercut our pricing on 50+ SKUs significantly:
1. Escalate to Catalog Manager via escalation_create with severity: high
2. Catalog Manager reviews: price match, absorb, or differentiate via content/service
3. If matching: Price Optimizer implements batch adjustment with Catalog Manager approval
4. If > 15% revenue-at-risk: Human Principal notified for strategic decision

### New Product Launch Onboarding
1. Catalog Manager creates new SKU entry with product spec sheet
2. Content Writer produces complete description package (title, description, bullets, meta)
3. Price Optimizer sets initial price based on competitive benchmarking and margin floor
4. Competitor Monitor adds to monitoring list
5. Catalog Manager approves and publishes

---

> **Syntax reference:** See [ORG.md Reference](../../docs/org-md-reference.md) for complete field documentation and all supported options.
