import React from 'react';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 transform transition-transform max-h-[80vh] flex flex-col">
        <div className="p-6 pb-0">
          <div className="text-lg font-bold mb-4">Schema Commands</div>
        </div>
        
        <div className="space-y-6 overflow-y-auto p-6 pt-0">
          <div>
            <div className="font-semibold text-blue-600 mb-3">Creating Tables</div>
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-2">Single Table</div>
                <pre className="bg-gray-50 p-2 rounded text-sm">{`Create a users table with name, email, password`}</pre>
              </div>
              
              <div>
                <div className="font-medium mb-2">Multiple Tables</div>
                <pre className="bg-gray-50 p-2 rounded text-sm">{`Create a blog with:
- users (name, email, password)
- posts (title, content, published_at)
- comments (content, created_at)`}</pre>
              </div>
            </div>
          </div>

          <div>
            <div className="font-semibold text-blue-600 mb-3">Modifying Schema</div>
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-2">1. Add Column</div>
                <pre className="bg-gray-50 p-2 rounded text-sm">{`add [table_name].[column_name] [type]

e.g. add users.email varchar(100)`}</pre>
              </div>

              <div>
                <div className="font-medium mb-2">2. Remove Column</div>
                <pre className="bg-gray-50 p-2 rounded text-sm">{`remove [table_name].[column_name]

e.g. remove users.email`}</pre>
              </div>

              <div>
                <div className="font-medium mb-2">3. Change Column Type</div>
                <pre className="bg-gray-50 p-2 rounded text-sm">{`change [table_name].[column_name] to [type]

e.g. change users.email to text`}</pre>
              </div>

              <div>
                <div className="font-medium mb-2">4. Set Primary Key</div>
                <pre className="bg-gray-50 p-2 rounded text-sm">{`primary [table_name].[field_name]

e.g. primary users.id`}</pre>
              </div>

              <div>
                <div className="font-medium mb-2">5. Remove Table</div>
                <pre className="bg-gray-50 p-2 rounded text-sm">{`remove [table_name]

e.g. remove users`}</pre>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 mt-auto">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
          Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
