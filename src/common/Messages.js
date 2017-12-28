var Messages = {
    APPEND_PATH : function(id, points) {
        return {
            action: "append_path_points",
            id: id,
            points: points
        };
    },

    NEW_PATH : function(path) {
        return {
            action: "new_path",
            path: path.to_dictionary()
        };
    },

    NEW_DIMENSIONS : function(width, height) {
        return {
            action: "new_dimensions",
            width: width,
            height: height
        };
    },

    CLEAR : function(){
        return {
            action: "clear"
        };
    }
};