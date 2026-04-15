import logging

import algokit_utils

logger = logging.getLogger(__name__)


def deploy() -> None:
    from smart_contracts.artifacts.blockd_certificate.blockd_certificate_client import (
        BlockdCertificateFactory,
        BlockdCertificateMethodCallCreateParams,
    )

    algorand = algokit_utils.AlgorandClient.from_environment()
    deployer = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(
        BlockdCertificateFactory,
        default_sender=deployer.address,
    )

    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
        create_params=BlockdCertificateMethodCallCreateParams(method="create()void"),
    )

    logger.info(
        "BLOCKD_CERTIFICATE deployed: app_id=%s app_address=%s operation=%s",
        app_client.app_id,
        app_client.app_address,
        result.operation_performed,
    )
