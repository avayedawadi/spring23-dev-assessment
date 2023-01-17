import { MongoClient } from 'mongodb';

export async function paginationAdminRequest(collection, pageSize, pageNumber) {
    let objectArray = [];
    await collection.find()
             .sort( { _id: 1 } )
             .skip( pageNumber > 0 ? ( ( pageNumber - 1 ) * pageSize ) : 0 )
             .limit( pageSize ).forEach( obj => {
                objectArray.push(obj);
              } );
    return objectArray;
}