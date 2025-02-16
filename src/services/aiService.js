import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  initialize() {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      throw new Error('API key not found. Please set your Gemini API key in the settings.');
    }
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    } catch (error) {
      if (error.toString().includes('GoogleGenerativeAI Error')) {
        throw new Error(
          'Please check your API key or provide a valid one from https://makersuite.google.com/app/apikey'
        );
      }
      throw error;
    }
  }

  async parseSchemaDescription(description) {
    try {
      if (!this.genAI || !this.model) {
        try {
          this.initialize();
        } catch (error) {
          console.error('Initialization Error:', error);
          throw error;
        }
      }

      const modificationPatterns = {
        addColumn: /add\s+(\w+)\.(\w+)\s+(\w+(?:\(\d+\))?)/i,
        removeColumn: /(?:remove|delete)\s+(\w+)\.(\w+)/i,
        removeTable: /(?:remove|delete)\s+(\w+)/i,
        setPrimaryKey: /primary\s+(\w+)\.(\w+)/i,
        changeType: /change\s+(\w+)\.(\w+)\s+to\s+(\w+(?:\(\d+\))?)/i,
      };

      // Check for modification commands first
      for (const [type, pattern] of Object.entries(modificationPatterns)) {
        const match = description.match(pattern);
        if (match) {
          switch (type) {
            case 'addColumn':
              return {
                isModification: true,
                type: 'add_column',
                tableName: match[1],
                column: {
                  name: match[2],
                  type: match[3],
                },
              };

            case 'removeColumn':
              return {
                isModification: true,
                type: 'remove_column',
                tableName: match[1],
                columnName: match[2],
              };

            case 'removeTable':
              return {
                isModification: true,
                type: 'remove_table',
                tableName: match[1],
              };

            case 'setPrimaryKey':
              return {
                isModification: true,
                type: 'set_primary_key',
                tableName: match[1],
                fieldName: match[2],
              };

            case 'changeType':
              return {
                isModification: true,
                type: 'change_type',
                tableName: match[1],
                fieldName: match[2],
                newType: match[3],
              };
          }
        }
      }

      // If no modification commands found, treat as schema creation
      const prompt = `
        Convert this database schema description to JSON format:
        "${description}"
        
        Expected format:
        {
          "tables": [
            {
              "name": "table_name",
              "fields": [
                {
                  "name": "field_name",
                  "type": "field_type",
                  "isPrimary": boolean,
                  "isForeignKey": boolean,
                  "references": { "table": "table_name", "field": "field_name" }
                }
              ]
            }
          ],
          "relationships": [
            {
              "from": { "table": "table_name", "field": "field_name" },
              "to": { "table": "table_name", "field": "field_name" },
              "type": "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many"
            }
          ]
        }
        
        Rules:
        1. DO NOT add any default fields (like 'id')
        2. Only include fields that are explicitly mentioned
        3. Detect and specify relationship types:
           - one-to-one: When each record in both tables has exactly one matching record
           - one-to-many: When a record in one table can have multiple matching records in another
           - many-to-one: When multiple records in one table match a single record in another
           - many-to-many: When multiple records in both tables can match each other
        4. Use standard SQL types (text, varchar, integer, etc.)
        5. Keep table and field names in snake_case
        6. Mark foreign key fields with isForeignKey=true
        7. Include references for foreign key fields
      `;

      let result;
      try {
        result = await this.model.generateContent(prompt);
      } catch (error) {
        if (error.toString().includes('GoogleGenerativeAI Error')) {
          throw new Error(
            'Please check your API key or provide a valid one from https://makersuite.google.com/app/apikey'
          );
        }
        throw error;
      }
      
      const response = result.response;
      const text = response.text();

      try {
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }

        const schema = JSON.parse(jsonMatch[0]);

        // Validate schema structure
        if (!schema.tables || !Array.isArray(schema.tables)) {
          throw new Error('Invalid schema format');
        }

        // Process tables
        schema.tables = schema.tables.map(table => ({
          ...table,
          fields: (table.fields || []).map(field => ({
            ...field,
            isPrimary: field.isPrimary || false,
            isForeignKey: field.isForeignKey || false,
            references: field.references || null
          }))
        }));

        // Ensure relationships array exists
        schema.relationships = (schema.relationships || []).map(rel => ({
          ...rel,
          type: rel.type || 'one-to-many' // default relationship type
        }));

        return { isModification: false, schema };
      } catch (error) {
        console.error('Error parsing AI response:', error);
        throw new Error('Failed to parse schema. Click the ? button above to see example commands and schema format.');
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }
}

export default new AIService();
