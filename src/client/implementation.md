Whiteboard
--
Purpose: To draw paths received from Socket; to tell Socket about new paths

Public Methods:
- updateOrCreatePath(id, fill, width, points) returns null
- appendPoints(id, points) returns null

Socket
--
Purpose: To update path information on server; to provide Whiteboard with new information about paths
- updateOrCreatePath(id, fill, width, points) returns null