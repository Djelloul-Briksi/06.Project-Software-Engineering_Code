''' Module to handle database (sqlite3) functions '''


import sqlite3


DB_NAME = "database.db"


class DatabaseException(Exception):
    ''' Class to handle database exceptions '''

    def __init__(self, message):
        super().__init__(self, message)
        self.message = message

    def __str__(self):
        return("Database Exception: {}".format(self.message))
    

class Database():
    ''' Class to hold a database connection '''

    def __init__(self, db_name = None):
        '''
        Constructor: initializes database object.
        dbname: name of the database (complete file name with path). Default 'database.db'
        return: connection object (sqlites3)
        '''
        self.db_conn = None
        if db_name is None:
            db_name = DB_NAME
        try:
            self.db_conn = sqlite3.connect(f'file:{db_name}?mode=ro', uri=True)
        except:
            raise DatabaseException("cannot connect to database '{}'".format(db_name))

    def close(self):
        if self.db_conn is not None:
            self.db_conn.close()
