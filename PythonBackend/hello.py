import os
from dotenv import load_dotenv
from azure.storage.fileshare import ShareServiceClient

load_dotenv()

connection_string = f"DefaultEndpointsProtocol=https;AccountName={os.getenv('AZ_STORAGE_ACC_NAME')};AccountKey={os.getenv('AZ_STORAGE_ACC_KEY')};EndpointSuffix=core.windows.net"
service_client = ShareServiceClient.from_connection_string(connection_string)

share_client = service_client.get_share_client("store")

for item in share_client.list_directories_and_files():
    print(f"Item: {item['name']} (Directory: {item['is_directory']})")
